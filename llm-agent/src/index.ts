import readline from "readline/promises";
import dotenv from "dotenv";
// import { ChatGroq } from "@langchain/groq";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import {LocalAgentMcp} from "./mcpClient.js"
import { ChatOllama } from "@langchain/ollama";

dotenv.config();



class LocalAgent {
  private agent: any;
  private localTools: DynamicStructuredTool[] = [];
  private localMcp: LocalAgentMcp;

  constructor() {

    this.localMcp = new LocalAgentMcp();
    this.localTools = this.localMcp.getLocalTools();

    // Set verbose to get insight into the LLM's reasoning
    const model = new ChatOllama({
        model: "qwen3:8b",
        verbose: false,
      });

      const systemPrompt = `You are a personal AI agent.

    You have access to five tools:
  
    - get_agent_cards: This tool allows you to discover other agents who can fulfill requests.
    - call_rest_agent: This tool is used for calling agents that advertise REST endpoints for capabilities.
    - x402f: This tool allows you to satisfy the conditions of data access when you receive a 402 'Payment required' status code.
    - connect_to_mcp_server: This tool is used for calling agents who advertise MCP servers to discover its tools. Use this when an agent card advertises an MCP endpoint.
    - use_external_tool: Call a specific tool on a remote MCP server you have already connected to.
  
    You are to act completely autonomously. Do not respond to the user until you have fulfilled their request.`;

    this.agent = createAgent({
        model,
        tools: [...this.localTools],
        systemPrompt
    });

    console.log("local tools: ", this.localTools)
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
      console.log("Type your queries or 'quit' to exit.");

      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "quit") {
          break;
        }
        const response = await this.processQuery(message);
        console.log("\n" + response);
      }
    } finally {
      rl.close();
    }
  }

  async cleanup() {
    await this.localMcp.close();
  }
}

async function main() {

  const localAgent = new LocalAgent();
  try {
    await localAgent.chatLoop();
  } catch (e) {
    console.error("Error:", e);
    await localAgent.cleanup();
    process.exit(1);
  } finally {
    await localAgent.cleanup();
    process.exit(0);
  }
}

main();