import {
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


async invokeAgent(query: string, toolNameList: string[]): Promise<AgentResponse> {

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

    console.log("Query received");

    let modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());

    console.log("Beginning agent loop...");

		this.toolbay.activateTools(toolNameList)

		let retryToolCallCount = 0;
		let retryInvokeCount = 0;

    while (true) {

      if (this.toolbay.isDirty()) {
        modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());
      }

			let agenticChoices: any = null;

			try {
				agenticChoices = await this.processThoughtsOnRequest(modelWithTools, messages)
			} catch (err: any) {
				retryInvokeCount++
				if (retryInvokeCount >= MAX_INVOKE_RETRIES) {
					console.log(`Agent failure: ${agenticChoices}`)
          throw new Error(`Agent failed after ${MAX_INVOKE_RETRIES} attempts. Last error: ${err.message || String(err)}`);
        }
        console.warn(`Stream error (attempt ${retryInvokeCount}/${MAX_INVOKE_RETRIES}), retrying: ${err.message}`);
        continue;
			}

      messages.push(agenticChoices);

			console.log(`agenticChoices: ${agenticChoices}`)

      if (!agenticChoices.tool_calls?.length) {
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
				if(fangornAgentConfig.useMemory) {
					this.shortTermMemory.updateSTM(messages)
				}

				console.log("The agent's text response:")
				console.log(text)

        return { text, mcpResults };
      }

      console.log("Intercepting tool calls:", agenticChoices.tool_calls);

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
  }

	private async processThoughtsOnRequest(modelWithTools: any, messages: BaseMessage[]) {
			let fullMessage: any | null
      try {
        const stream = await modelWithTools.stream(messages);
        for await (const chunk of stream) {
          if (!fullMessage) {
            fullMessage = chunk;
          } else {
            fullMessage = fullMessage.concat(chunk);
          }
        }
      } catch (err: any) {
				throw err
      }
			return fullMessage
	}

	public reset() {
		this.toolbay.resetToolBay();
	}

	public getAllToolNames(): string[] {
		return this.toolbay.getAllToolNames();
	}
}
