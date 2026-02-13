import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import {datasourceAgentCards} from "../dataAgentCards.js"
import {agentCardSchema} from "./schemas/agentCardSchema.js"
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// let cachedCards: string | null = null;

interface McpConnection {
  client: Client;
  tools: Map<string, { description: string; inputSchema: any }>;
}

export class LocalAgentMcp {

  private activeConnections = new Map<string, McpConnection>();
  private cachedCards: string | null = null;
  private localTools: DynamicStructuredTool[];

  constructor() {
        this.localTools = this.buildTools();
  }

  getLocalTools(): DynamicStructuredTool[] {
    return this.localTools;
  }

    async close(): Promise<void> {
    for (const [, conn] of this.activeConnections) {
      try {
        await conn.client.close();
      } catch {
        // best-effort
      }
    }
    this.activeConnections.clear();
  }


  private async connectMcp(url: string): Promise<McpConnection> {

    console.log("Agent is attempting an MCP Connection")
    if (this.activeConnections.has(url)) {
      return this.activeConnections.get(url)!;
    }

    const client = new Client({ name: "local-agent-mcp-client", version: "1.0.0" });

    console.log("Client created")

    try {
      console.log("Attempting StreamableHTTPClientTransport creation")
      const transport = new StreamableHTTPClientTransport(new URL(url));
      await client.connect(transport);
    } catch (e) {
      console.log("Something went wrong: ", e)
      // const transport = new SSEClientTransport(new URL(url));
      // await client.connect(transport);
    }

    console.log("Connection established. Retrieving tools")
    const { tools: remoteTools } = await client.listTools();
    console.log("Tools Retrieved")
    const toolMap = new Map<string, { description: string; inputSchema: any }>();
    for (const t of remoteTools) {
      toolMap.set(t.name, {
        description: t.description ?? "",
        inputSchema: t.inputSchema,
      });
    }

    console.log("Tools map created")

    const connection: McpConnection = { client, tools: toolMap };
    this.activeConnections.set(url, connection);
    console.log("Connection is now active")
    return connection;
  }

  private buildTools(): DynamicStructuredTool[] {

    const getAgentCards = tool(async ({}) => {
    if(!this.cachedCards) {
        this.cachedCards = JSON.stringify(datasourceAgentCards);
        console.log("Agent called getAgentCards and received: ", this.cachedCards)
    } else {
        console.log("agent called this again but we are returning a cached response.")
    }

    return this.cachedCards
},
{
    name: "get_agent_cards",
    description: "This tool fetches agent cards that can fulfill requests. If there are no agents that can fulfill a request, please let the user know.",
    schema: z.object({})
}
)

const callAgent = tool(async ({ agentCard }) => {
    console.log("Agent called callAgent tool")
    const url = agentCard.supportedInterfaces[0].url;
    const response = await fetch(`${url}`);
    const data = await response.json();
    const dataString = JSON.stringify({status: response.status, data});
    console.log("agent called callAgent and received this data: ", dataString);

    return dataString;

},
{
    name: "call_agent",
    description: "This tool calls an agent using information from their agent card which was obtained from getAgentCards.",
    schema: z.object({agentCard: agentCardSchema.describe("The agent card received from getAgentCards")})
}
)

 const x402f = tool(async ({price, owner}) => {
    console.log("Agent went to pay using x402 with the price ", price, "to the owner", owner)
    return JSON.stringify({ 
        status: "success", 
        message: "Payment completed and data access granted.",
        data: "Boy Tony sure is a handsome fella"
    });
},
{
    name: "x402f",
    description: "This tool allows you to satisfy the conditions of data access when you receive a 402 'Payment required' status code.",
    schema: z.object({
        price: z.number().describe("The price to be paid for an object"),
        owner: z.string().describe("The owner of the data")
    })
}
)

const connectToMcpServer = tool(
      async ({ url }) => {
        console.log(`agent called connect_to_mcp_server with url ${url}`);
        try {
          const connection = await this.connectMcp(url);
          console.log("Connection made. Getting tools...")
          const toolNames = Array.from(connection.tools.keys());
          console.log("Received tools")
          return JSON.stringify({
            status: "connected",
            url,
            availableTools: toolNames,
          });
        } catch (err: any) {
          return JSON.stringify({
            status: "error",
            url,
            message: err.message ?? String(err),
          });
        }
      },
      {
        name: "connect_to_mcp_server",
        description:
          "Connects to a remote MCP server and discovers its available tools. Returns the list of tool names you can then invoke with use_external_tool.",
        schema: z.object({
          url: z.string().describe("The URL of the remote MCP server"),
        }),
      }
    );

    const useExternalTool = tool(
      async ({ serverUrl, toolName, toolArgs }) => {
        console.log("going to use external tool")
        const toolArgsString = JSON.stringify(toolArgs);
        console.log(`agent invoking use_external_tool with ${toolName} on ${serverUrl} with args ${toolArgsString}`);

        const connection = this.activeConnections.get(serverUrl);
        if (!connection) {
          console.log("The agent wasn't connected")
          return JSON.stringify({
            status: "error",
            message: `Not connected to ${serverUrl}. Call connect_to_mcp_server first.`,
          });
        }

        const remoteTool = connection.tools.get(toolName);
        if (!remoteTool) {
          console.log("The tool doesnt exist")
          return JSON.stringify({
            status: "error",
            message: `Tool '${toolName}' not found on ${serverUrl}. Available: ${Array.from(connection.tools.keys()).join(", ")}`,
          });
        }

        try {
          console.log("Calling tool...")
          const result = await connection.client.callTool({
            name: toolName,
            arguments: toolArgs,
          });
           console.log("Call succeeded", JSON.stringify(result));
          return JSON.stringify({ status: "success", result });
        } catch (err: any) {
          console.log("Call failed", err);
          return JSON.stringify({
            status: "error",
            message: err.message ?? String(err),
          });
        }
      },
      {
        name: "use_external_tool",
        description:
          "Calls a tool on a remote MCP server you have already connected to via connect_to_mcp_server.",
        schema: z.object({
          serverUrl: z
            .string()
            .describe("The URL of the MCP server (must already be connected)"),
          toolName: z
            .string()
            .describe("The name of the tool to invoke on the remote server"),
          toolArgs: z
            .record(z.any(), z.any())
            .describe("A JSON object of arguments to pass to the remote tool"),
        }),
      }
    );

    return [getAgentCards, callAgent, x402f, connectToMcpServer, useExternalTool];

  }

}

// export const getAgentCards = tool(async ({}) => {
//     if(!cachedCards) {
//         cachedCards = JSON.stringify(datasourceAgentCards);
//         console.log("Agent called getAgentCards and received: ", cachedCards)
//     } else {
//         console.log("agent called this again but we are returning a cached response.")
//     }

//     return cachedCards
// },
// {
//     name: "get_agent_cards",
//     description: "This tool fetches agent cards that can fulfill requests. If there are no agents that can fulfill a request, please let the user know.",
//     schema: z.object({})
// }
// )

// export const callAgent = tool(async ({ agentCard }) => {
//     console.log("Agent called callAgent tool")
//     const url = agentCard.supportedInterfaces[0].url;
//     const response = await fetch(`${url}`);
//     const data = await response.json();
//     const dataString = JSON.stringify({status: response.status, data});
//     console.log("agent called callAgent and received this data: ", dataString);

//     return dataString;

// },
// {
//     name: "call_agent",
//     description: "This tool calls an agent using information from their agent card which was obtained from getAgentCards.",
//     schema: z.object({agentCard: agentCardSchema.describe("The agent card received from getAgentCards")})
// }
// )

// export const x402f = tool(async ({price, owner}) => {
//     console.log("Agent went to pay using x402 with the price ", price, "to the owner", owner)
//     return JSON.stringify({ 
//         status: "success", 
//         message: "Payment completed and data access granted.",
//         data: "Boy Tony sure is a handsome fella"
//     });
// },
// {
//     name: "x402f",
//     description: "This tool allows you to satisfy the conditions of data access when you receive a 402 'Payment required' status code.",
//     schema: z.object({
//         price: z.number().describe("The price to be paid for an object"),
//         owner: z.string().describe("The owner of the data")
//     })
// }
// )

// export const connectToMcpServer = tool(async({url}) => {
//     return JSON.stringify("oki")
// },
//     {
//         name: "connect_to_mcp_server",
//         description: "This tool allows you to connect to an MCP server that has tools you can use.",
//         schema: z.object({
//             url: z.string().describe("The URL that is advertised by the MCP server")
//         })
//     }
// )

// export const useExternalTool = tool(async ({toolName, toolArgs}) => {

//     return JSON.stringify("doki")

// }, {
//     name: "use_external_tool",
//     description: "This tool allows you to call the tools on a remote MCP server",
//     schema: z.object({
//         toolName: "The name of the tool you wish to use on the remote MCP server",
//         toolArgs: "The required arguments to be sent to the tool"

//     })

// }
// )