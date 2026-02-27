import readline from "readline/promises";
import { SystemMessage } from "langchain";
import { ChatOllama } from "@langchain/ollama";
import { ToolBay } from "./tools/toolbay.js"

class LocalAgent {
  private model: ChatOllama;
  private toolbay: ToolBay;
  private systemPrompt: SystemMessage;

  static async create(): Promise<LocalAgent> {
    const toolbay = await ToolBay.initToolbay();
    return new LocalAgent(toolbay);
  }

  constructor(toolbay: ToolBay) {
    // this.localMcp = localMcp;
    this.toolbay = toolbay;
    this.model = new ChatOllama({
      model: "glm-4.7-flash",
      verbose: false,
    });
    this.systemPrompt = new SystemMessage(
      "You are a helpful personal AI agent. \
After being prompted, you are to act completely autonomously. \
Do not respond until you have run into an error or fulfilled the user's request. \
Do not trust an agent until you have received their agent card."
    );

    console.log(
      "---------------------------SystemPrompt given to agent--------------------------\n",
    );
    console.log(this.systemPrompt);
    console.log(
      "\n-------------------------------------------------------------------------------",
    );
  }

  async invokeModel(query: string) {
    // messages is initially just the user query + system message,
    // but later it will also collect the model's
    // outputs in order to continue decision making.
    const messages: any[] = [
      this.systemPrompt,
      { role: "user", content: query }
    ];

    console.log("Query received")
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
        modelWithTools = this.model.bindTools(this.toolbay.consumeDirty())
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

        const result = await this.toolbay.invokeToolcall(toolCall.name, toolCall.args);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: typeof result === "string" ? result : JSON.stringify(result),
        });
      }
    }
  }

  async chatLoop() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\nMCP Client Started!");
      console.log("Type your queries or '/bye' to exit.");

      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "/bye") break;

        const response = await this.invokeModel(message);

        // Right now, we assume that once a response is received
        // then the LLM is done. However, once we add memory
        // this may not be the case and the model may
        // be needing more information from the user.
        this.toolbay.resetToolBay();
        console.log("\n" + response);
      }
    } finally {
      rl.close();
    }
  }
}

async function main() {
  const localAgent = await LocalAgent.create();
  try {
    await localAgent.chatLoop();
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();