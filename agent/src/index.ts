import {
  buildFindSimilarPrompt,
  systemPromptFooter,
  systemPromptHeader,
  findSimilarSystemPrompt,
  buildChooseFiltersPrompt,
  chooseFiltersSystemPrompt,
} from "./prompts.js";
import {
  McpUiResult,
  DataContext,
  LLMProvider,
  AgenticConfig,
  AgentEventHandler,
  ToolboxEntry,
} from "@fangorn-network/agent-types";
import { ToolBay } from "@fangorn-network/agent-tools";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "langchain";
import { FangornSTM } from "./memory.js";
import { FangornAgentModel, getFangornAgentModel } from "./llm.js";
import { FangornAgentConfig } from "@fangorn-network/agent-types";

export interface FangornAgentResponse {
  text: string;
  mcpResults: McpUiResult;
}

const MAX_INVOKE_RETRIES = 3;
const MAX_TOOL_RETRIES = 3;

export class FangornAgent {
  private agentModel: FangornAgentModel;
  private llmProvider: LLMProvider;
  private llmModel: string;
  private toolbay: ToolBay;
  private shortTermMemory: FangornSTM;
  private useMemory: boolean;
  private defaultSystemPrompt: SystemMessage;

  static async create(
    fangornAgentConfig: FangornAgentConfig,
    dataContextProvider: () => DataContext,
  ): Promise<FangornAgent> {
    const toolbay = await ToolBay.initToolbay(
      fangornAgentConfig.toolboxDir,
      fangornAgentConfig.toolboxEntries,
      dataContextProvider,
    );
    return new FangornAgent(toolbay, fangornAgentConfig);
  }

  constructor(toolbay: ToolBay, fangornAgentConfig: FangornAgentConfig) {
    this.toolbay = toolbay;
    this.useMemory = fangornAgentConfig.useMemory;

    const agenticConfig = fangornAgentConfig.agenticConfig;

    this.agentModel = getFangornAgentModel(agenticConfig);
    this.llmProvider = agenticConfig.llmProvider;
    this.llmModel = agenticConfig.llmModel;

    this.shortTermMemory = new FangornSTM(
      this.llmProvider,
      fangornAgentConfig.memoryBudget,
    );

    this.defaultSystemPrompt = new SystemMessage(
      fangornAgentConfig.systemPrompt,
    );

    // Display systemPrompt info
    console.log(systemPromptHeader);
    console.log(fangornAgentConfig.systemPrompt);
    console.log(systemPromptFooter);
  }

  changeModel(agenticConfig: AgenticConfig) {
    console.log(
      `Changing model from ${this.llmModel} to ${agenticConfig.llmModel}`,
    );
    this.agentModel = getFangornAgentModel(agenticConfig);
    console.log("Change completed.");
  }

  changeProvider(agenticConfig: AgenticConfig) {
    console.log(
      `Changing provider from ${this.llmProvider} to ${agenticConfig.llmProvider} using model ${agenticConfig.llmModel}`,
    );
    this.llmProvider = agenticConfig.llmProvider;
    this.llmModel = agenticConfig.llmModel;
    this.agentModel = getFangornAgentModel(agenticConfig);
    console.log("Change completed");
  }

  async loadToolbox(entry: ToolboxEntry): Promise<void> {
    // const { activateToolboxPlugins } = await import("./toolboxes/utils.js");
    console.log("Load toolbox called");
    await this.toolbay.addToolbox(entry);
  }

  unloadToolbox(name: string): void {
    console.log("Unload toolbox called");
    this.toolbay.removeToolbox(name);
  }

  /**
   * Chat with the full agent. It decides what tools it will use for which task via activation of toolboxes.
   * This is only suitable for agents with strong multi-step reasoning skills. STM is always enabled
   * in this mode.
   * @param query The message to begin agent interaction with.
   * @returns
   */
  async fullAgenticChat(
    query: string,
    systemPromptOverride?: string,
    onEvent?: AgentEventHandler,
  ): Promise<FangornAgentResponse> {
    let systemMessage: SystemMessage =
      this.getSystemPrompt(systemPromptOverride);
    console.log("FullAgenticChat: Message receieved");
    this.toolbay.activateAgenticTools();
    const userMessage = new HumanMessage(query);
    const messages = this.shortTermMemory.getInitialSTM(
      systemMessage,
      userMessage,
    );
    let modelWithTools = this.agentModel.bindTools(this.toolbay.consumeDirty());
    return await this.agentLoop(modelWithTools, messages, true, onEvent);
  }

  /**
   * Chat with the agent by giving them a subset of tools to work with. STM is enabled my setting USE_MEMORY=true.
   * @param query
   * @param toolNameList
   * @returns
   */
  async toolScopedAgenticChat(
    query: string,
    toolNameList: string[],
    systemPromptOverride?: string,
    onEvent?: AgentEventHandler,
  ): Promise<FangornAgentResponse> {
    console.log(
      `LimitedChat: Agent will have ${toolNameList.length == 0 ? "no" : toolNameList} tools enabled`,
    );
    const systemMessage = this.getSystemPrompt(systemPromptOverride);
    const userMessage = new HumanMessage(query);
    let messages: BaseMessage[];
    if (this.useMemory) {
      messages = this.shortTermMemory.getInitialSTM(systemMessage, userMessage);
    } else {
      messages = [systemMessage, userMessage];
    }
    this.toolbay.activateTools(toolNameList);
    const modelWithTools = this.agentModel.bindTools(
      this.toolbay.consumeDirty(),
    );
    console.log("Beginning agent loop...");
    return await this.agentLoop(
      modelWithTools,
      messages,
      this.useMemory,
      onEvent,
    );
  }

  public getSystemPrompt(systemPromptOverride?: string): SystemMessage {
    if (systemPromptOverride) {
      console.log(
        `Agent: System prompt override specified: ${systemPromptOverride}`,
      );
      return new SystemMessage(systemPromptOverride);
    }

    console.log(
      `Agent: Using default system prompt: ${this.defaultSystemPrompt.text}`,
    );
    return this.defaultSystemPrompt;
  }

  public setSystemPrompt(systemPrompt: string) {
    console.log(`Agent: Setting new system prompt to be ${systemPrompt}`);
    this.defaultSystemPrompt = new SystemMessage(systemPrompt);
  }

  /**
   * The main agent loop
   * @param model The model which may or may not have tools bound to it
   * @param messages The messages to prompt the agent with
   * @param stmEnabled Whether or not the agent will have short term memory
   * @returns
   */
  private async agentLoop(
    model: any,
    messages: BaseMessage[],
    stmEnabled: boolean = false,
    onEvent?: AgentEventHandler,
  ): Promise<FangornAgentResponse> {
    let promptAgentCount = 0;
    while (true) {
      if (this.toolbay.isDirty()) {
        model = this.agentModel.bindTools(this.toolbay.consumeDirty());
      }
      let agenticChoices: any = null;
      try {
        agenticChoices = await this.promptModel(model, messages);
      } catch (err: any) {
        promptAgentCount++;
        if (promptAgentCount >= MAX_INVOKE_RETRIES) {
          console.log(`Agent failure: ${agenticChoices}`);
          throw new Error(
            `Agent failed after ${MAX_INVOKE_RETRIES} attempts. Last error: ${err.message || String(err)}`,
          );
        }
        console.warn(
          `Stream error (attempt ${promptAgentCount}/${MAX_INVOKE_RETRIES}), retrying: ${err.message}`,
        );
        continue;
      }
      messages.push(agenticChoices);

      this.emitRoundEvents(agenticChoices, onEvent);

      // No tools are going to be called, process the final response
      if (!agenticChoices.tool_calls?.length) {
        return this.processAgentResponse(agenticChoices, messages, stmEnabled);
      }
      console.log("Intercepting tool calls:", agenticChoices.tool_calls);
      await this.performToolCalls(agenticChoices, messages, onEvent);
    }
  }

  /**
   * Surface a round's reasoning and any interim text to the caller so the
   * user can watch progress. Final answers are not emitted here — they are
   * returned by the loop.
   */
  private emitRoundEvents(agenticChoices: any, onEvent?: AgentEventHandler) {
    if (!onEvent) return;
    const reasoning = agenticChoices.additional_kwargs?.reasoning_content;
    if (typeof reasoning === "string" && reasoning.trim()) {
      onEvent({ type: "thinking", text: reasoning.trim() });
    }
    if (agenticChoices.tool_calls?.length) {
      const text =
        typeof agenticChoices.content === "string"
          ? agenticChoices.content
          : "";
      if (text.trim()) {
        onEvent({ type: "assistant_text", text: text.trim() });
      }
    }
  }

  private async promptModel(model: any, messages: BaseMessage[]) {
    let fullMessage: any | null;
    try {
      const stream = await model.stream(messages);
      for await (const chunk of stream) {
        if (!fullMessage) {
          fullMessage = chunk;
        } else {
          fullMessage = fullMessage.concat(chunk);
        }
      }
    } catch (err: any) {
      throw err;
    }
    return fullMessage;
  }

  private async performToolCalls(
    agenticChoices: any,
    messages: BaseMessage[],
    onEvent?: AgentEventHandler,
  ) {
    let retryToolCallCount = 0;
    for (const toolCall of agenticChoices.tool_calls) {
      const containsTool = this.toolbay.containsTool(toolCall.name);
      if (!containsTool) {
        console.log(`Tool "${toolCall.name}" not found`);
        onEvent?.({
          type: "tool_result",
          name: toolCall.name,
          ok: false,
          preview: `Tool "${toolCall.name}" not found.`,
        });
        const toolMessage = new ToolMessage({
          tool_call_id: toolCall.id,
          content: `Tool "${toolCall.name}" not found.`,
        });
        messages.push(toolMessage);
        continue;
      }
      onEvent?.({
        type: "tool_call",
        name: toolCall.name,
        args: toolCall.args ?? {},
      });
      let result: any;
      let toolOk = true;
      try {
        result = await this.toolbay.invokeToolcall(
          toolCall.name,
          toolCall.args,
        );
        retryToolCallCount = 0;
      } catch (err: any) {
        toolOk = false;
        retryToolCallCount++;
        if (retryToolCallCount >= MAX_TOOL_RETRIES) {
          result = `Tool failed after ${MAX_TOOL_RETRIES} attempts. Last error: ${err.message || String(err)}. Please inform the user that this query could not be completed.`;
          retryToolCallCount = 0;
        } else {
          result = `Tool error: ${err.message || String(err)}. Please fix your query and try again. (Attempt ${retryToolCallCount} of ${MAX_TOOL_RETRIES})`;
        }
      }
      const content =
        typeof result === "string" ? result : JSON.stringify(result);
      onEvent?.({
        type: "tool_result",
        name: toolCall.name,
        ok: toolOk,
        preview: content.length > 200 ? content.slice(0, 200) + "…" : content,
      });
      const toolMessage = new ToolMessage({
        tool_call_id: toolCall.id,
        content,
      });
      messages.push(toolMessage);
    }
  }

  private processAgentResponse(
    agenticChoices: any,
    messages: BaseMessage[],
    stmEnabled: boolean,
  ): FangornAgentResponse {
    console.log("console.log - Model returned final response");
    let text: string;
    if (typeof agenticChoices.content === "string") {
      text = agenticChoices.content;
    } else {
      text = agenticChoices.content
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text)
        .join("\n");
    }
    const mcpResults = this.toolbay.consumeMcpResults();
    if (stmEnabled) {
      this.shortTermMemory.updateSTM(messages);
    }
    console.log("The agent's text response:");
    console.log(text);
    return { text, mcpResults };
  }

  public reset() {
    this.toolbay.resetToolBay();
  }

  public getAllToolNames(): string[] {
    return this.toolbay.getAllToolNames();
  }

  public getToolBoxToolNamesMap(): Map<string, string[]> {
    return this.toolbay.getToolBoxToolNamesMap();
  }
}
