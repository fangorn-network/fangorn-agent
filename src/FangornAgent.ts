import {
  systemPrompt,
  systemPromptFooter,
  systemPromptHeader,
} from "./constants.js";
import { ChatOllama } from "@langchain/ollama";
import { ToolBay, McpUiResult } from "./tools/toolbay.js";
import { ChatAnthropic } from "@langchain/anthropic"
import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "langchain";

export interface AgentResponse {
  text: string;
  mcpResults: McpUiResult;
}
const VALID_LLMS = ["ollama", "anthropic"];


const MAX_INVOKE_RETRIES = 3;
const MAX_TOOL_RETRIES = 3;

// medium is currently unused
const MEMORY_BUDGETS: Record<string, number> = {
  'ollama':  1024,   // 4B and under
  'medium': 6144,   // 9B-27B
  'anthropic':  16384,  // 70B+ or API models like Claude
};


export class FangornAgent {
  private model: ChatAnthropic | ChatOllama;
  private toolbay: ToolBay;
	private shortTermMemory: BaseMessage[];
	private memoryBudget: number;

  static async create(dataContextProvider: () => any): Promise<FangornAgent> {
    const toolbay = await ToolBay.initToolbay(dataContextProvider);
    return new FangornAgent(toolbay);
  }

  constructor(toolbay: ToolBay) {
    this.toolbay = toolbay;

		const llmType = process.env.LLM;

		if (!llmType) throw new Error("No LLM specified")
		if(!VALID_LLMS.includes(llmType)) throw new Error("Invalid LLM specified.")

		if (llmType === "ollama") {
			const ollamaPort = process.env.OLLAMA_PORT || 11434; // fallback to default if not set
    	const model = process.env.MODEL || "qwen3.5:4b"
    	console.log(`running ${model} model`)
    	const baseUrl = `http://localhost:${ollamaPort}`;
    	this.model = new ChatOllama({
    	  model,
    	  verbose: false,
    	  baseUrl
    	});
		} else {
				this.model = new ChatAnthropic({
				model: 'claude-sonnet-4-6',
				maxRetries: 3
			})
		}
		
		this.shortTermMemory = []
		this.memoryBudget = MEMORY_BUDGETS[llmType]

    // Display systemPrompt info
    console.log(systemPromptHeader);
    console.log(systemPrompt);
    console.log(systemPromptFooter);
  }

private trimShortTermMemory(): void {
  let total = 0;

  for (let i = this.shortTermMemory.length - 1; i >= 0; i--) {
    const content = typeof this.shortTermMemory[i].content === "string"
      ? this.shortTermMemory[i].content as string
      : JSON.stringify(this.shortTermMemory[i].content);
    const estimate = Math.ceil(content.length / 4);

    if (total + estimate > this.memoryBudget) {
      // Drop everything before index i+1
      this.shortTermMemory = this.shortTermMemory.slice(i + 1);
      return;
    }
    total += estimate;
  }
}

private sanitizeForShortTermMemory(msgs: BaseMessage[]): BaseMessage[] {
  return msgs.map(msg => {
    const type = msg.type;

    if (type === "ai") {
      const kwargs = (msg as any).kwargs ?? (msg as any);
      const additional = kwargs.additional_kwargs;

      if (additional) {
        delete additional.reasoning_content;
        delete additional.response_metadata;
        delete additional.tool_call_chunks;
        delete additional.usage_metadata;
      }

      if (kwargs.response_metadata) {
        kwargs.response_metadata = {};
      }

      // These are top-level kwargs fields
      delete kwargs.tool_call_chunks;
      delete kwargs.usage_metadata;
    }

    if (type === "tool") {
      const content = (msg as ToolMessage).content;
      if (typeof content === "string") {
        (msg as any).content = this.truncateToolContent(content);
      }
    }

    return msg;
  });
}

private truncateToolContent(content: string, maxLen: number = 500): string {
  if (content.length <= maxLen) return content;

  const firstLine = content.split("\n")[0];
  if (firstLine.length <= maxLen) {
    return firstLine + "\n[Full results were shown to user in UI]";
  }

  return content.slice(0, maxLen) + "... [truncated]";
}

async invokeAgent(query: string, options: { hasEntityContext: boolean}): Promise<AgentResponse> {
    // const messages: any[] = [systemPrompt, { role: "user", content: query }];

		const systemMessage = new SystemMessage(systemPrompt.content);
    const userMessage = new HumanMessage(query);

    // The messages that the agent should have to perserve conversations
    // within the same session
    const messages: BaseMessage[] = [
      systemMessage, ...this.shortTermMemory, userMessage
    ]

		const newMessagesIndex = messages.length

    console.log("Query received");
    let modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());
    console.log("Beginning agent loop...");

    this.toolbay.hasEntityContext = options.hasEntityContext;

    let retryInvokeCount = 0;
		let retryToolCallCount = 0;

    while (true) {

      if (this.toolbay.isDirty()) {
        modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());
      }

      let fullMessage: any = null;

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
        retryInvokeCount++;
        if (retryInvokeCount >= MAX_INVOKE_RETRIES) {
          throw new Error(`Agent failed after ${MAX_INVOKE_RETRIES} attempts. Last error: ${err.message || String(err)}`);
        }
        console.warn(`Stream error (attempt ${retryInvokeCount}/${MAX_INVOKE_RETRIES}), retrying: ${err.message}`);
        continue;
      }

      messages.push(fullMessage);

      if (!fullMessage.tool_calls?.length) {
        console.log("console.log - Model returned final response");

        let text: string;
        if (typeof fullMessage.content === "string") {
					console.log("fullMessage content type was string")
          text = fullMessage.content;
					console.log(`text: ${text}`)
        } else {
					console.log("fullMessage content type was not string")
          text = fullMessage.content
            .filter((block: any) => block.type === "text")
            .map((block: any) => block.text)
            .join("\n");
					console.log(`text: ${text}`)
        }

        const mcpResults = this.toolbay.consumeMcpResults();
        this.toolbay.hasEntityContext = false;
        retryInvokeCount = 0;
				const newMessages = messages.slice(newMessagesIndex)
				this.shortTermMemory.push(...this.sanitizeForShortTermMemory(newMessages))
				this.trimShortTermMemory()
        return { text, mcpResults };
      }

      console.log("Intercepting tool calls:", fullMessage.tool_calls);

      for (const toolCall of fullMessage.tool_calls) {

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

  public resetToolbay() {
    this.toolbay.resetToolBay();
  }
}