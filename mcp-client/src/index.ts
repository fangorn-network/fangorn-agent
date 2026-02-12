import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import dotenv from "dotenv";
// import { ChatGroq } from "@langchain/groq";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { zodToJsonSchema } from "zod-to-json-schema";
import {jsonSchemaToZod} from "./utils.js"
import { z } from "zod";
import { createAgent } from "langchain";
import * as tools from "./tools.js"
import { ChatOllama } from "@langchain/ollama";

dotenv.config();



class MCPClient {
  private mcp: Client;
  private agent: any;
  private transport: StdioClientTransport | null = null;
  private localTools: DynamicStructuredTool[] = [];
  private externalTools: DynamicStructuredTool[] = [];

  constructor() {
    this.localTools = Object.values(tools)
    // Set verbose to get insight into the LLM's reasoning
    const model = new ChatOllama({
        model: "qwen3:8b",
        verbose: false,
      });

      const systemPrompt = `You are a personal AI agent.

    You have access to three tools:
  
    - get_agent_cards: This tool allows you to discover other agents who can fulfill requests.
    - call_agent: This tool is used after receiving an agent card from the get_agent_cards tool.
    - x402f: This tool allows you to satisfy the conditions of data access when you receive a 402 'Payment required' status code.
  
    You are to act completely autonomously. Do not respond to the user until you have fulfilled their request.`;

    this.agent = createAgent({
        model,
        tools: [...this.localTools],
        systemPrompt
    });

    console.log("local tools: ", this.localTools)
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
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
    await this.mcp.close();
  }
}

async function main() {
  // if (process.argv.length < 3) {
  //   console.log("Usage: npx ts-node index.ts <path_to_server_script>");
  //   return;
  // }
  const mcpClient = new MCPClient();
  try {
    // await mcpClient.connectToServer(process.argv[2]);
    await mcpClient.chatLoop();
  } catch (e) {
    console.error("Error:", e);
    await mcpClient.cleanup();
    process.exit(1);
  } finally {
    await mcpClient.cleanup();
    process.exit(0);
  }
}

main();