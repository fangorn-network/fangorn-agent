import readline from "readline/promises";
import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { createAgent, SystemMessage } from "langchain";
import { LocalAgentMcp } from "./mcpClient.js";
import { ChatOllama } from "@langchain/ollama";
import {MemorySaver} from "@langchain/langgraph";
import { ToolBay } from "./toolbay.js"
import { z } from "zod";

class LocalAgent {
  private model: ChatOllama;
  private toolbay: ToolBay;
  private localMcp: LocalAgentMcp;
  private systemPrompt: SystemMessage;

  static async create(): Promise<LocalAgent> {
    const localMcp = await LocalAgentMcp.create();
    return new LocalAgent(localMcp);
  }

  constructor(localMcp: LocalAgentMcp) {
    this.localMcp = localMcp;
    this.toolbay = new ToolBay();
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

    // Only inject category tools at startup
    this.toolbay.inject(this.buildToolboxes());
    // this.toolbay.clearDirty(); // not dirty on init

    console.log(
      "---------------------------SystemPrompt given to agent--------------------------\n",
    );
    console.log(this.systemPrompt);
    console.log(
      "\n-------------------------------------------------------------------------------",
    );
  }

private buildToolboxes(): DynamicStructuredTool[] {
  const x402fCategoryTool = tool(
    async () => {
      console.log("console.log - agent called agent_tools category tool, injecting sub-tools...");
      
      const subTools = this.localMcp.getLocalTools();
      this.toolbay.inject(subTools, "agent_tools");

      return JSON.stringify({
        status: 200,
        statusText: "OK",
        message: "agent tools are now available. You now have access to: search_agents, get_agent_card, call_x402f_agent. Re-plan and use them to complete the task."
      });
    },
    {
      name: "agent_tools",
      description: "Access agent tools for searching agents, retrieving agent cards, and calling x402f-enabled agents. Call this first before attempting any agent related tasks.",
      schema: z.object({}),
    }
  );
  return [x402fCategoryTool];
}

  async processQuery(query: string) {
    const messages: any[] = [
      this.systemPrompt,
      { role: "user", content: query }
    ];

    console.log("Top level model started")
    let modelWithTools = this.model.bindTools(this.toolbay.consumeDirty());

    while (true) {
      console.log("Calling model...");

      if (this.toolbay.isDirty()) {
        modelWithTools = this.model.bindTools(this.toolbay.consumeDirty())
      } 

      const stream = await modelWithTools.stream(messages);

      let fullMessage: any = null;
      for await (const chunk of stream) {
        if (!fullMessage) {
          fullMessage = chunk;
        } else {
          fullMessage = fullMessage.concat(chunk);
        }

        if (chunk.tool_call_chunks?.length) {
          for (const toolChunk of chunk.tool_call_chunks) {
            console.log(`Tool being called: ${toolChunk.name ?? "(building...)"}`);
          }
        }
      }

      messages.push(fullMessage);

      if (!fullMessage.tool_calls?.length) {
        console.log("Model returned final response");
        return fullMessage.content;
      }

      console.log("Intercepting tool calls:", fullMessage.tool_calls);

      for (const toolCall of fullMessage.tool_calls) {
        const tool = this.toolbay.getAll().find(t => t.name === toolCall.name);

        if (!tool) {
          console.log(`Tool "${toolCall.name}" not found`);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Tool "${toolCall.name}" not found.`,
          });
          continue;
        }

        console.log(`Executing tool: ${toolCall.name}`);
        const result = await tool.invoke(toolCall.args);
        console.log(`Tool result: ${result}`);

        if (this.toolbay.isDirty()) {
          console.log("Toolbay updated with new tools, rebinding on next iteration...");
          // this.toolbay.clearDirty();
        }

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

        const response = await this.processQuery(message);
        this.toolbay.resetToolBay(this.buildToolboxes());
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