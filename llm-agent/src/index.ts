import readline from "readline/promises";
// import { ChatGroq } from "@langchain/groq";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import {LocalAgentMcp} from "./mcpClient.js"
import { ChatOllama } from "@langchain/ollama";



class LocalAgent {
  private agent: any;
  private localTools: DynamicStructuredTool[] = [];
  private localMcp: LocalAgentMcp;

  static async create(): Promise<LocalAgent> {

    const localMcp = await LocalAgentMcp.create();

    return new LocalAgent(localMcp);
  }

  constructor(localMcp: LocalAgentMcp) {

    this.localMcp = localMcp;
    this.localTools = this.localMcp.getLocalTools();

    // Set verbose to get insight into the LLM's reasoning
    const model = new ChatOllama({
        model: "glm-4.7-flash",
        verbose: false,
      });

    const numOfLocalTools = this.localTools.length;

    const toolDescriptions = this.localTools
      .map((tool) => `- ${tool.name}: ${tool.description}`)
      .join("\n");

  const systemPrompt = 
`You are a personal AI agent.

You have access to ${numOfLocalTools} tools:
${toolDescriptions}

You are to act completely autonomously. Do not respond until you have fulfilled the user's request.`;


    console.log("SystemPrompt: ", systemPrompt)
    this.agent = createAgent({
        model,
        tools: [...this.localTools],
        systemPrompt
    });

    // console.log("local tools: ", this.localTools)
  }

  async processQuery(query: string) {
    const response = await this.agent.invoke({
      messages: [{ role: "user", content: query }],
    });

    // Get the last message (the final response)
    const lastMessage = response.messages[response.messages.length - 1];
    return lastMessage.content;
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
        if (message.toLowerCase() === "/bye") {
          break;
        }
        const response = await this.processQuery(message);
        console.log("\n" + response);
      }
    } finally {
      rl.close();
    }
  }

  // async cleanup() {
  //   await this.localMcp.close();
  // }
}

async function main() {

  const localAgent = await LocalAgent.create();
  try {
    await localAgent.chatLoop();
  } catch (e) {
    console.error("Error:", e);
    // await localAgent.cleanup();
    process.exit(1);
  } finally {
    // await localAgent.cleanup();
    process.exit(0);
  }
}

main();