import readline from "readline/promises";
import {
  systemPrompt,
  systemPromptFooter,
  systemPromptHeader,
} from "./constants.js";
import { ChatOllama } from "@langchain/ollama";
import { ToolBay } from "./tools/toolbay.js";

export class FangornAgent {
  private model: ChatOllama;
  private toolbay: ToolBay;

  static async create(): Promise<FangornAgent> {
    const toolbay = await ToolBay.initToolbay();
    return new FangornAgent(toolbay);
  }

  constructor(toolbay: ToolBay) {
    this.toolbay = toolbay;
    const ollamaPort = process.env.OLLAMA_PORT || 11434; // fallback to default if not set
    const model = process.env.MODEL || "qwen3:8b"
    const baseUrl = `http://localhost:${ollamaPort}`;
    this.model = new ChatOllama({
      model,
      verbose: false,
      baseUrl
    });

    // Display systemPrompt info
    console.log(systemPromptHeader);
    console.log(systemPrompt);
    console.log(systemPromptFooter);
  }

  async invokeAgent(query: string) {
    // messages is initially just the user query + system message,
    // but later it will also collect the model's
    // outputs in order to continue decision making.
    const messages: any[] = [systemPrompt, { role: "user", content: query }];

    console.log("Query received");
    let modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());

    // in order to hot swap tools, we have to process
    // the entire agent event loop so we can check if the
    // toolbay is dirty. If so, we me must re-bind the new
    // tools to the model. There is no way to hot-swap
    // tools with an agent made via createAgent unless
    // we create a new agent every time.
    while (true) {
      console.log("Calling model...");

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
        return fullMessage.content;
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
