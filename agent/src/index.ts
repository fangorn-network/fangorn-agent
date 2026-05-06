import {
  buildFindSimilarPrompt,
  agenticSystemPrompt,
  systemPromptFooter,
  systemPromptHeader,
  findSimilarSystemPrompt,
  buildChooseFiltersPrompt,
  chooseFiltersSystemPrompt,
} from "./prompts.js";
import {
  McpUiResult,
  DataContext,
} from "agent-types";
import {
  ToolBay
} from "agent-tools"
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "langchain";
import { FangornSTM } from "./memory.js";
import { FangornAgentModel, getModelType } from "./llm.js";
import { FangornAgentConfig } from "agent-types";

export interface FangornAgentResponse {
  text: string;
  mcpResults: McpUiResult;
}

const MAX_INVOKE_RETRIES = 3;
const MAX_TOOL_RETRIES = 3;

export class FangornAgent {
  private model: FangornAgentModel;
  private toolbay: ToolBay;
  private shortTermMemory: FangornSTM;
  private useMemory: boolean;

  static async create(
    fangornAgentConfig: FangornAgentConfig,
    dataContextProvider: () => DataContext,
  ): Promise<FangornAgent> {
    const toolbay = await ToolBay.initToolbay(
      dataContextProvider,
      fangornAgentConfig.fangornAgentToolConfig,
    );
    return new FangornAgent(toolbay, fangornAgentConfig.useMemory);
  }

  constructor(toolbay: ToolBay, useMemory: boolean) {
    this.toolbay = toolbay;
    this.useMemory = useMemory

    let llmType = process.env.LLM;
    if (!llmType) {
      console.warn("No LLM type specified, defaulting to ollama");
      llmType = "ollama";
    }

    this.model = getModelType(llmType);

    this.shortTermMemory = new FangornSTM(llmType);

    // Display systemPrompt info
    console.log(systemPromptHeader);
    console.log(agenticSystemPrompt);
    console.log(systemPromptFooter);
  }

  /**
   * Chat with the full agent. It decides what tools it will use for which task via activation of toolboxes.
   * This is only suitable for agents with strong multi-step reasoning skills. STM is always enabled
   * in this mode.
   * @param query The message to begin agent interaction with.
   * @returns
   */
  async fullAgenticChat(query: string): Promise<FangornAgentResponse> {
    console.log("FullAgenticChat: Message receieved");
    this.toolbay.activateAgenticTools();
    const systemMessage = new SystemMessage(agenticSystemPrompt.content);
    const userMessage = new HumanMessage(query);
    const messages = this.shortTermMemory.getInitialSTM(
      systemMessage,
      userMessage,
    );
    let modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());
    return await this.agentLoop(modelWithTools, messages, true);
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
  ): Promise<FangornAgentResponse> {
    console.log(
      `LimitedChat: Agent will have ${toolNameList.length == 0 ? "no" : toolNameList} tools enabled`,
    );
    const systemMessage = new SystemMessage(agenticSystemPrompt.content);
    const userMessage = new HumanMessage(query);
    let messages: BaseMessage[];
    if (this.useMemory) {
      messages = this.shortTermMemory.getInitialSTM(systemMessage, userMessage);
    } else {
      messages = [systemMessage, userMessage];
    }
    this.toolbay.activateTools(toolNameList);
    const modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());
    console.log("Beginning agent loop...");
    return await this.agentLoop(modelWithTools, messages, this.useMemory);
  }

  /**
   * Find data that is similar to the data provided. Uses no short term memory
   * and uses a pre-determined algorithm with the LLM to produce diverse results.
   *
   * @param data Reference data for discovery
   */
  async findSimilar(data: any): Promise<FangornAgentResponse> {
    // const toolNameList = ["choose_tag"]
    // this.toolbay.activateTools(toolNameList)
    // const modelWithTools = this.model.bindTools(this.toolbay.consumeDirty())
    // const modelWithStructuredOutput = this.model.withStructuredOutput(vibeWordsSchema)
    console.log("Find similar called");
    const prompt = buildFindSimilarPrompt(data);
    data = {
      tags: ["relaxed", "energetic", "longing"],
      context: ["rainy-day", "love", "beauty"],
    };
    // Idea: We prompt the agent to choose one word that captures the "Vibe"
    // based on the tags it has received. When it chooses its word, it will
    // call the choose_tag tool and break the agent loop. We then
    // query for files based on that tag. If there are results, we
    // smile, if there are none, we re-prompt the agent.
    let messages = [findSimilarSystemPrompt, prompt];
    let agentResponse = await this.agentLoop(this.model, messages);

    let searchWords = agentResponse.text.split(",");

    console.log(`The agent's response: ${searchWords}`);

    return { text: searchWords.join(), mcpResults: {} };

    // The agent has called the tool and exited. Now we need to query the client
    // Once we have data, we can re-bind the agent with more tools?
  }

  async returnFilters(data: any): Promise<FangornAgentResponse> {
    console.log("Return filters called");

    const taste =
      "I enjoy a wide range of genres and my preferences shift based on my mood and setting. My primary interests include hip-hop, classic rock, psychedelic rock, and 90s R&B. I'm drawn to mainstream pop in social settings and lean toward moody R&B and soul during more reflective moments. I actively seek out emerging and underground artists through streaming platforms. I have no strong genre loyalty and prioritize how music sounds and resonates with me over genre labels";
    const prompt = buildChooseFiltersPrompt(taste);

    let messages = [chooseFiltersSystemPrompt, prompt];
    let agentResponse = await this.agentLoop(this.model, messages);

    let searchWords = agentResponse.text.split(",");

    console.log(`The agent's response: ${searchWords}`);

    return { text: searchWords.join(), mcpResults: {} };
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
  ): Promise<FangornAgentResponse> {
    let promptAgentCount = 0;
    while (true) {
      if (this.toolbay.isDirty()) {
        model = this.model.bindTools(this.toolbay.consumeDirty());
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

      // No tools are going to be called, process the final response
      if (!agenticChoices.tool_calls?.length) {
        return this.processAgentResponse(agenticChoices, messages, stmEnabled);
      }
      console.log("Intercepting tool calls:", agenticChoices.tool_calls);
      this.performToolCalls(agenticChoices, messages);
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

  private async performToolCalls(agenticChoices: any, messages: BaseMessage[]) {
    let retryToolCallCount = 0;
    for (const toolCall of agenticChoices.tool_calls) {
      const containsTool = this.toolbay.containsTool(toolCall.name);
      if (!containsTool) {
        console.log(`Tool "${toolCall.name}" not found`);
        const toolMessage = new ToolMessage({
          tool_call_id: toolCall.id,
          content: `Tool "${toolCall.name}" not found.`,
        });
        messages.push(toolMessage);
        continue;
      }
      let result: any;
      try {
        result = await this.toolbay.invokeToolcall(
          toolCall.name,
          toolCall.args,
        );
        retryToolCallCount = 0;
      } catch (err: any) {
        retryToolCallCount++;
        if (retryToolCallCount >= MAX_TOOL_RETRIES) {
          result = `Tool failed after ${MAX_TOOL_RETRIES} attempts. Last error: ${err.message || String(err)}. Please inform the user that this query could not be completed.`;
          retryToolCallCount = 0;
        } else {
          result = `Tool error: ${err.message || String(err)}. Please fix your query and try again. (Attempt ${retryToolCallCount} of ${MAX_TOOL_RETRIES})`;
        }
      }
      const toolMessage = new ToolMessage({
        tool_call_id: toolCall.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
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
