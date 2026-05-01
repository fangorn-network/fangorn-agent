import {
	buildFindSimilarPrompt,
  systemPrompt,
  systemPromptFooter,
  systemPromptHeader,
} from "./prompts.js";
import { ToolBay, McpUiResult } from "./tools/toolbay.js";
import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "langchain";
import { fangornAgentConfig } from "./config.js";
import { DataContext } from "./tools/types.js";
import { FangornSTM } from "./memory.js";
import { FangornAgentModel, getModelType } from "./llm.js";
import { promptAgent } from "./utils.js";

export interface AgentResponse {
  text: string;
  mcpResults: McpUiResult;
}

const MAX_INVOKE_RETRIES = 3;
const MAX_TOOL_RETRIES = 3;

export class FangornAgent {
  private model: FangornAgentModel;
  private toolbay: ToolBay;
	private shortTermMemory: FangornSTM;

  static async create(dataContextProvider: () => DataContext): Promise<FangornAgent> {
    const toolbay = await ToolBay.initToolbay(dataContextProvider);
    return new FangornAgent(toolbay);
  }

  constructor(toolbay: ToolBay) {
    this.toolbay = toolbay;

		const llmType = process.env.LLM;
		if (!llmType) throw new Error("No LLM specified")

		this.model = getModelType(llmType)

		this.shortTermMemory = new FangornSTM(llmType)

    // Display systemPrompt info
    console.log(systemPromptHeader);
    console.log(systemPrompt);
    console.log(systemPromptFooter);
  }

	// Chat with the full agent. It decides what tools it will use for which task via activation of toolboxes.
	// This is only suitable for agents with strong multi-step reasoning skills. STM is always enabled
	// in this mode
	async fullAgenticChat(query: string): Promise<AgentResponse> {
		this.toolbay.activateAgenticTools();
		const systemMessage = new SystemMessage(systemPrompt.content);
	  const userMessage = new HumanMessage(query);
		const messages = this.shortTermMemory.getInitialSTM(systemMessage, userMessage);
	  console.log("Query received");
	  let modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());
	  return await this.agentLoop(modelWithTools, messages, true)
	}

	// Chat with the agent by giving them a subset of tools to work with.
	async limitedAgenticChat(query: string, toolNameList: string[]): Promise<AgentResponse> {
		console.log(`LimitedChat: Agent will have ${toolNameList.length == 0 ? "no" : toolNameList} tools enabled`)
		const systemMessage = new SystemMessage(systemPrompt.content);
    const userMessage = new HumanMessage(query);
		let messages: BaseMessage[];
		if(fangornAgentConfig.useMemory) {
			messages = this.shortTermMemory.getInitialSTM(systemMessage, userMessage)
		} else {
			messages = [
      	systemMessage, userMessage
    	]
		}
		this.toolbay.activateTools(toolNameList)
    const modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());
    console.log("Beginning agent loop...");
		return await this.agentLoop(modelWithTools, messages, fangornAgentConfig.useMemory)
	}

	async findSimilar(data: any) {
		const toolNameList = ["choose_tag"]
		this.toolbay.activateTools(toolNameList)
		const modelWithTools = this.model.bindTools(this.toolbay.consumeDirty())
		const prompt = buildFindSimilarPrompt(data)

		// Idea: We prompt the agent to choose one word that captures the "Vibe"
		// based on the tags it has received. When it chooses its word, it will
		// call the choose_tag tool and break the agent loop. We then
		// query for files based on that tag. If there are results, we
		// smile, if there are none, we re-prompt the agent.
		let messages = [systemPrompt, prompt]
		await this.agentLoop(modelWithTools, messages)

		// The agent has called the tool and exited. Now we need to query the client
		// Once we have data, we can re-bind the agent with more tools?

	}

	private async agentLoop (modelWithTools: any, messages: BaseMessage[], stmEnabled: boolean = false): Promise<AgentResponse> {
		let promptAgentCount = 0;
		while (true) {
			let agenticChoices: any = null;
			try {
				agenticChoices = await promptAgent(modelWithTools, messages)
			} catch (err: any) {
				promptAgentCount++
				if (promptAgentCount >= MAX_INVOKE_RETRIES) {
					console.log(`Agent failure: ${agenticChoices}`)
          throw new Error(`Agent failed after ${MAX_INVOKE_RETRIES} attempts. Last error: ${err.message || String(err)}`);
        }
        console.warn(`Stream error (attempt ${promptAgentCount}/${MAX_INVOKE_RETRIES}), retrying: ${err.message}`);
        continue;
			}
      messages.push(agenticChoices);
			console.log(`agenticChoices: ${agenticChoices}`)

			// No tools are going to be called, process the final response
      if (!agenticChoices.tool_calls?.length) {
				return this.processAgentResponse(agenticChoices, messages, stmEnabled)
      }
      console.log("Intercepting tool calls:", agenticChoices.tool_calls);
			this.performToolCalls(agenticChoices, messages)
    }
	}

	private async performToolCalls(agenticChoices: any, messages: BaseMessage[]) {
		let retryToolCallCount = 0;
		for (const toolCall of agenticChoices.tool_calls) {
      const containsTool = this.toolbay.containsTool(toolCall.name);
      if (!containsTool) {
        console.log(`Tool "${toolCall.name}" not found`);
        const toolMessage = new ToolMessage({tool_call_id: toolCall.id, content: `Tool "${toolCall.name}" not found.`})
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
			const toolMessage = new ToolMessage({tool_call_id: toolCall.id, content: typeof result === "string" ? result : JSON.stringify(result)})
      messages.push(toolMessage);
    }
	}

	private processAgentResponse(agenticChoices: any, messages: BaseMessage[], stmEnabled: boolean): AgentResponse {
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
		if(stmEnabled) {
			this.shortTermMemory.updateSTM(messages)
		}
		console.log("The agent's text response:")
		console.log(text)
		return { text, mcpResults };
	}


	public reset() {
		this.toolbay.resetToolBay();
	}

	public getAllToolNames(): string[] {
		return this.toolbay.getAllToolNames();
	}
}
