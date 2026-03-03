import {
  systemPrompt,
  systemPromptFooter,
  systemPromptHeader,
} from "./constants.js";
import { ChatOllama } from "@langchain/ollama";
import { ToolBay } from "./tools/toolbay.js";
import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "langchain";
import { MemoryManager } from "./memory/memoryManager.js";

export class FangornAgent {
  private model: ChatOllama;
  private toolbay: ToolBay;
  private shortTermMemory: BaseMessage[];
  private memoryManager: MemoryManager;

  static async create(): Promise<FangornAgent> {
    const toolbay = await ToolBay.initToolbay();
    const ollamaPort = process.env.OLLAMA_PORT || 11434; // fallback to default if not set
    const ollamaUrl = `http://localhost:${ollamaPort}`;
    const qdrantPort = process.env.QDRANT_PORT || 6333;
    const qdrantUrl = `http://localhost:${qdrantPort}`
    const memoryManager = await MemoryManager.init(ollamaUrl, qdrantUrl);
    return new FangornAgent(ollamaUrl, toolbay, memoryManager);
  }

  constructor(baseUrl: string, toolbay: ToolBay, memoryManager: MemoryManager) {
    this.toolbay = toolbay;
    const model = process.env.MODEL || "qwen3.5:4b"
    console.log(`running ${model} model`)
    this.model = new ChatOllama({
      model,
      verbose: false,
      baseUrl
    });

    this.shortTermMemory = [];

    this.memoryManager = memoryManager;

    // Display systemPrompt info
    console.log(systemPromptHeader);
    console.log(systemPrompt);
    console.log(systemPromptFooter);
  }

  async invokeAgent(query: string) {

    const memories = await this.memoryManager.recall(query);
    const memoryBlock = memories.length
      ? `\nRelevant context from past conversations:\n${memories.join("\n")}`
      : "";

    const systemMessage = new SystemMessage(systemPrompt.content + memoryBlock);
    const userMessage = new HumanMessage(query);

    // The messages that the agent should have to perserve conversations
    // within the same session
    const messages: BaseMessage[] = [
      systemMessage, ...this.shortTermMemory, userMessage
    ]

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
        this.shortTermMemory.push(...messages)
        await this.extractMemories(query, fullMessage.content);
        return fullMessage.content;
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

        const result = await this.toolbay.invokeToolcall(
          toolCall.name,
          toolCall.args,
        );

        const toolMessage = new ToolMessage({tool_call_id: toolCall.id, content: typeof result === "string" ? result : JSON.stringify(result)})

        messages.push(toolMessage);
      }
    }
  }

  private async extractMemories(query: string, response: string) {
    const systemMessage = new SystemMessage({content: "Extract key facts, user preferences, or important decisions from this exchange as bullet points. Only include things worth remembering across conversations. If nothing notable, respond with exactly: NONE",})
    const humanMessage = new HumanMessage({content: `User: ${query}\nAssistant: ${response}`})
    const extraction = await this.model.invoke([systemMessage, humanMessage]);
    const content =
      typeof extraction.content === "string"
        ? extraction.content
        : JSON.stringify(extraction.content);

    if (!content.includes("NONE")) {
      console.log("Agent decided it should extract memories")
      await this.memoryManager.remember(content);
    } else {
      console.log("Agent decided it should NOT extract memories")
    }
  }

  public resetToolbay() {
    this.toolbay.resetToolBay();
  }
}
