import {
  systemPrompt,
  systemPromptFooter,
  systemPromptHeader,
} from "./constants.js";
import { ChatOllama } from "@langchain/ollama";
import { ToolBay, McpUiResult } from "./tools/toolbay.js";
import { ChatAnthropic } from "@langchain/anthropic"

export interface AgentResponse {
  text: string;
  mcpResults: McpUiResult[];
}

export class FangornAgent {
  private model: ChatAnthropic;
  private toolbay: ToolBay;

  static async create(): Promise<FangornAgent> {
    const toolbay = await ToolBay.initToolbay();
    return new FangornAgent(toolbay);
  }

  constructor(toolbay: ToolBay) {
    this.toolbay = toolbay;
    const ollamaPort = process.env.OLLAMA_PORT || 11434; // fallback to default if not set
    const model = process.env.MODEL || "qwen3.5:4b"
    console.log(`running ${model} model`)
    const baseUrl = `http://localhost:${ollamaPort}`;
    // this.model = new ChatOllama({
    //   model,
    //   verbose: false,
    //   baseUrl
    // });

    this.model = new ChatAnthropic(
      'claude-sonnet-4-6'
    )

    // Display systemPrompt info
    console.log(systemPromptHeader);
    console.log(systemPrompt);
    console.log(systemPromptFooter);
  }

  async invokeAgent(query: string): Promise<AgentResponse> {
    // messages is initially just the user query + system message,
    // but later it will also collect the model's
    // outputs in order to continue decision making.
    const messages: any[] = [systemPrompt, { role: "user", content: query }];

    console.log("Query received");
    let modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());
    console.log("Beginning agent loop...");

    // in order to hot swap tools, we have to process
    // the entire agent event loop so we can check if the
    // toolbay is dirty. If so, we me must re-bind the new
    // tools to the model. There is no way to hot-swap
    // tools with an agent made via createAgent unless
    // we create a new agent every time.
    while (true) {

      if (this.toolbay.isDirty()) {
        modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());
      }

      const stream = await modelWithTools.stream(messages);

      // build model's next message from stream to intercept tool calls later
      let fullMessage: any = null;
      for await (const chunk of stream) {
        if (!fullMessage) {
          fullMessage = chunk;
        } else {
          fullMessage = fullMessage.concat(chunk);
        }
      }

      messages.push(fullMessage);

      // the LLM has no more tools to call, a human readable response should be ready
      if (!fullMessage.tool_calls?.length) {
        console.log("console.log - Model returned final response");

        // Normalize content to a string (ChatAnthropic may return content blocks)
        let text: string;
        if (typeof fullMessage.content === "string") {
          text = fullMessage.content;
        } else {
          text = fullMessage.content
            .filter((block: any) => block.type === "text")
            .map((block: any) => block.text)
            .join("\n");
        }

        // Collect any MCP results that were stashed during tool execution
        const mcpResults = this.toolbay.consumeMcpResults();

        return { text, mcpResults };
      }

      console.log("Intercepting tool calls:", fullMessage.tool_calls);

      for (const toolCall of fullMessage.tool_calls) {
        const containsTool = this.toolbay.containsTool(toolCall.name);
        if (!containsTool) {
          console.log(`Tool "${toolCall.name}" not found`);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Tool "${toolCall.name}" not found.`,
          });
          continue;
        }

        const result = await this.toolbay.invokeToolcall(
          toolCall.name,
          toolCall.args,
        );

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: typeof result === "string" ? result : JSON.stringify(result),
        });
      }
    }
  }

  public resetToolbay() {
    this.toolbay.resetToolBay();
  }
}