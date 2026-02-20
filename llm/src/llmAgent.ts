import readline from "readline/promises";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { createAgent } from "langchain";
import { ChatOllama } from "@langchain/ollama";

const MCP_URL = process.env.MCP_URL || "http://mcp-client:3001/mcp";
const HEALTH_URL = process.env.MCP_HEALTH_URL || "http://mcp-client:3001/health";

// Wait for MCP server to be ready before starting
async function waitForMcp(retries = 20, delayMs = 3000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(HEALTH_URL);
      if (res.ok) {
        console.log("MCP server is ready.");
        return;
      }
    } catch {
      console.log(`Waiting for MCP server... (${i + 1}/${retries})`);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("MCP server never became ready.");
}

class LocalAgent {
  private agent: any;
  private mcpClient: Client;

  static async create(): Promise<LocalAgent> {
    await waitForMcp();

    const mcpClient = new Client({ name: "llm-agent", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    await mcpClient.connect(transport);

    return new LocalAgent(mcpClient);
  }

  constructor(mcpClient: Client) {
    this.mcpClient = mcpClient;
  }

  async initialize() {
    // loadMcpTools fetches the tool list from the connected MCP server
    const tools: DynamicStructuredTool[] = await loadMcpTools("local-agent-mcp", this.mcpClient);

    const model = new ChatOllama({ model: "glm-4.7-flash", verbose: false });

    const toolDescriptions = tools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join("\n");

    const systemPrompt = `You are a personal AI agent.

You have access to ${tools.length} tools:
${toolDescriptions}

You are to act completely autonomously. Do not respond until you have fulfilled the user's request.`;

    console.log("System prompt:\n", systemPrompt);

    this.agent = createAgent({ model, tools, systemPrompt });
  }

  async processQuery(query: string) {
    const response = await this.agent.invoke({
      messages: [{ role: "user", content: query }],
    });
    const lastMessage = response.messages[response.messages.length - 1];
    return lastMessage.content;
  }

  async chatLoop() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      console.log("\nAgent Started! Type '/bye' to exit.");
      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "/bye") break;
        const response = await this.processQuery(message);
        console.log("\n" + response);
      }
    } finally {
      rl.close();
      await this.mcpClient.close();
    }
  }
}

async function main() {
  const agent = await LocalAgent.create();
  await agent.initialize();
  await agent.chatLoop();
}

main().catch((e) => { console.error(e); process.exit(1); });