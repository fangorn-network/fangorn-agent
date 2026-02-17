import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import {datasourceAgentCards} from "./dataAgentCards.js"
import {agentCardSchema} from "./schemas/agentCardSchema.js"
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import dotenv from "dotenv";
import { Chain, createWalletClient, Hex, http, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {FangornConfig} from "fangorn/lib/config.js"
import {createFangornMiddleware, FangornX402Middleware} from "x402f"

dotenv.config();
// interface McpConnection {
//   client: Client;
//   transport: StreamableHTTPClientTransport;
//   tools: Map<string, { description: string; inputSchema: any }>;
// }

export class LocalAgentMcp {

  // private activeConnections = new Map<string, McpConnection>();
  private cachedCards: string | null = null;
  private localTools: DynamicStructuredTool[];
  // private walletClient: WalletClient;
  private x402fClient: FangornX402Middleware;

  static async create(): Promise<LocalAgentMcp> {

    const key = process.env.ETH_PRIVATE_KEY;
    if(!key) throw new Error("No private key found")
    const envChain = process.env.CHAIN
    if(!envChain) throw new Error("No chain specified")
    const config = envChain == "arbitrumSepolia" ? FangornConfig.ArbitrumSepolia : FangornConfig.BaseSepolia;
  
    const pinataJwt = process.env.PINATA_JWT;
    if(!pinataJwt) throw new Error("No pinataJWT provided")
    const pinataGateway = process.env.PINATA_GATEWAY;
    if(!pinataGateway) throw new Error("No pinataGateway provided")

    const account = privateKeyToAccount(key as Hex)
    const walletClient = createWalletClient({
      account,
      chain: config.chain as Chain | undefined,
      transport: http(config.rpcUrl)
    })

    const domain = "localhost"


    const x402fClient = await createFangornMiddleware(
        walletClient,
        config,
        domain,
        pinataJwt,
        pinataGateway
    );

    return new LocalAgentMcp(x402fClient)

  }

  constructor(x402fClient: FangornX402Middleware) {
    this.localTools = this.buildTools();
    this.x402fClient = x402fClient;
  }

  getLocalTools(): DynamicStructuredTool[] {
    return this.localTools;
  }

  // async close(): Promise<void> {
  //   for (const [, conn] of this.activeConnections) {
  //     try {
  //       await conn.client.close();
  //     } catch {
  //       // best-effort
  //     }
  //   }
  //   this.activeConnections.clear();
  // }


// private async connectMcp(url: string): Promise<McpConnection> {
//   console.log("Agent is attempting an MCP Connection");
//   if (this.activeConnections.has(url)) {
//     return this.activeConnections.get(url)!;
//   }

//   const client = new Client({ name: "local-agent-mcp-client", version: "1.0.0" });
//   console.log("Client created");

//   try {
//     console.log("Attempting StreamableHTTPClientTransport creation");
//     const transport = new StreamableHTTPClientTransport(new URL(url));
//     await client.connect(transport);

//     console.log("Connection established. Retrieving tools");
//     const { tools: remoteTools } = await client.listTools();
//     console.log("Tools Retrieved");

//     const toolMap = new Map<string, { description: string; inputSchema: any }>();
//     for (const t of remoteTools) {
//       toolMap.set(t.name, {
//         description: t.description ?? "",
//         inputSchema: t.inputSchema,
//       });
//     }
//     console.log("Tools map created");

//     const connection: McpConnection = { client, transport, tools: toolMap };
//     this.activeConnections.set(url, connection);
//     console.log("Connection is now active");
//     return connection;
//   } catch (e) {
//     console.log("Something went wrong: ", e);
//     throw e;
//   }
// }

  private buildTools(): DynamicStructuredTool[] {

    // const getAgentCards = tool(async ({}) => {
    //     if(!this.cachedCards) {
    //         this.cachedCards = JSON.stringify(datasourceAgentCards);
    //         console.log("Agent called getAgentCards")
    //         // console.log("agent cards", this.cachedCards)
    //     } else {
    //         console.log("agent called this again but we are returning a cached response.")
    //     }

    //     return this.cachedCards
    //     },
    //     {
    //         name: "get_agent_cards",
    //         description: "This tool fetches agent cards that can fulfill requests. If there are no agents that can fulfill a request, please let the user know.",
    //         schema: z.object({})
    //     }
    // )

    // const getAgentCards = tool(async ({}) => {
    //     if(!this.cachedCards) {
    //         this.cachedCards = JSON.stringify(datasourceAgentCards);
    //         console.log("Agent called getAgentCards")
    //         // console.log("agent cards", this.cachedCards)
    //     } else {
    //         console.log("agent called this again but we are returning a cached response.")
    //     }

    //     return this.cachedCards
    //     },
    //     {
    //         name: "get_agent_cards",
    //         description: "This tool fetches agent cards that can fulfill requests. If there are no agents that can fulfill a request, please let the user know.",
    //         schema: z.object({})
    //     }
    // )
    


    // const callDatasourceAgent = tool(async ({ agentCard }) => {
    //     console.log("Agent called callRestAgent tool")
    //     console.log(JSON.stringify(agentCard))
    //     const url = agentCard.supportedInterfaces[0].url;
    //     const response = await fetch(`${url}`);
    //     const data = await response.json();
    //     const dataString = JSON.stringify({status: response.status, data});
    //     console.log("agent called callRestAgent and received this data: ", dataString);
    //     return dataString;
    //     },
    //     {
    //         name: "get_agent_info",
    //         description: "This tool calls a datasource agent via the REST protocol using information from their agent card. Use this tool if you need to call a REST based datasource agent.",
    //         schema: z.object({agentCard: agentCardSchema.describe("The agent card received from getAgentCards")})
    //     }
    // )

    const searchAgents = tool(async ({}) => {

        console.log("agent called searchAgents")

        // We can feasibly give enough information to obtain only one agent result
        const agentResults = {
            agents: [{
                chainId: "421614",
                agentId: "0xfbe3194b6f46cc654d6a79632e5cab97d66e9d0bb14c553c063fe5457d929b41",
                name: "coleman_ds",
                description: "A REST based agent that provides the hello world text files.",
                owners: ["0x951f9e73FA32A83246782edb659ae1669C035BdF"],
                operators: [],
                active: true,
                x402support: true,
                updatedAt: "02/17/2026",
                a2aEndpoint: "https://a2a.fangorn.network/.well-known/agent-card.json",
                agentUri: "ipfs://thisissomedummyagenturithatimusingrightnow",
                agentURIType: 'ipfs'
        }]}

        return JSON.stringify(agentResults)
        },
        {
            name: "search_agents",
            description: "This tool finds agents that are registered in an ERC-8004 compliant manner. Use this when looking for agents to fulfill requests. You MUST remember the agentId for the agent you choose.",
            schema: z.object({})
        }
    )

    const getAgentCard = tool(async ({a2aEndpoint}) => {

        console.log(`a2aEndpoint: ${a2aEndpoint}`)

        let result;

        if(a2aEndpoint === "https://a2a.fangorn.network/.well-known/agent-card.json") {
            console.log("agent passed in correct a2a url")
            result = {"status": "200", "agent-card": datasourceAgentCards[2]}
        } else {
            result = {"status": "404"}
        }

        return JSON.stringify(result);
        },
        {
            name: "get_agent_card",
            description: "This tool fetches the agent card for the agent that can possibly fulfill your request. If you receive a status of 404 then either the agent doesn't exist, or you passed in an incorrect URL.",
            schema: z.object({a2aEndpoint: z.string().describe("This is the URL to call in order to obtain an agent card to communicate with the agent returned from the search_agents tool.")})
        }
    )

    


    const callx402fAgent = tool(async ({ id, tag, url }) => {
        console.log("Agent called callx402fAgent tool")
        console.log(`agentId: ${id}, file tag: ${tag}, urlbeingcalled: ${url}`)

        const hexId = id as Hex;

        if(url === "http://localhost:4021/resource") {

            const result = await this.x402fClient.fetchResource({
            id: hexId,
            tag,
            baseUrl: "http://localhost:4021"
        })

            if (result.success) {
                console.log("It was a success")
                return JSON.stringify({"status": 200, "filename": tag, filecontents: atob(result.dataString!)})
            } else {
                console.log("Something went wrong")
                console.log(result)
                return JSON.stringify({"status": "500"})
            }
            
        } else {

            console.log("The agent didn't pass in the correct URL")
            return JSON.stringify({"status": "404"})

        }

        },
        {
            name: "call_x402f_agent",
            description: "This tool calls an x402f enabled agent using information from their agent card. Use this tool if you need to call an x402f based datasource agent. A status of 200 means that the file has been obtained. Any other status means the request couldnt be fulfilled.",
            schema: z.object({
                id: z.string().describe("This is the id of the agent that provides the data"),
                tag: z.string().describe("This is the name of the file the user is looking for"),
                url: z.string().describe("This is the url that is advertised in the agent card")
            })
        }
    )

    return [searchAgents, getAgentCard, callx402fAgent];

// const callDatasourceAgent = tool(async ({ agentCard }) => {
//     console.log("Agent called callRestAgent tool")
//     console.log(JSON.stringify(agentCard))
//     const url = agentCard.supportedInterfaces[0].url;
//     const response = await fetch(`${url}`);
//     const data = await response.json();
//     const dataString = JSON.stringify({status: response.status, data});
//     console.log("agent called callRestAgent and received this data: ", dataString);

//     return dataString;

// },
// {
//     name: "call_datasource_agent",
//     description: "This tool calls a datasource agent via the REST protocol using information from their agent card. Use this tool if you need to call a REST based datasource agent.",
//     schema: z.object({agentCard: agentCardSchema.describe("The agent card received from getAgentCards")})
// }
// )

//  const x402f = tool(async ({price, owner}) => {
//     console.log("Agent went to pay using x402 with the price ", price, "to the owner", owner)

//     return JSON.stringify({ 
//         status: "success", 
//         message: "Conditions fulfilled and data access granted.",
//         data: "Boy Tony sure is a handsome fella"
//     });
// },
// {
//     name: "x402f",
//     description: "This tool allows you to satisfy the conditions of data access when you receive a 402 status code.",
//     schema: z.object({
//         price: z.number().describe("The condition represented as an integer needed to obtain data"),
//         owner: z.string().describe("The owner of the data")
//     })
// }
// )

// const connectToMcpServer = tool(
//       async ({ url }) => {
//         console.log(`agent called connect_to_mcp_server with url ${url}`);
//         try {
//           const connection = await this.connectMcp(url);
//           console.log("Connection made. Getting tools...")
//       const toolDetails = Array.from(connection.tools.entries()).map(
//         ([name, info]) => ({
//           name,
//           description: info.description,
//           inputSchema: info.inputSchema,
//         })
//       );
//           console.log("Received tools")
//           return JSON.stringify({
//             status: "connected",
//             url,
//             availableTools: toolDetails,
//           });
//         } catch (err: any) {
//           return JSON.stringify({
//             status: "error",
//             url,
//             message: err.message ?? String(err),
//           });
//         }
//       },
//       {
//         name: "connect_to_mcp_server",
//         description:
//           "This tool connects to a remote MCP server and discovers its available tools. Returns the list of tool names you can then invoke with use_external_tool.",
//         schema: z.object({
//           url: z.string().describe("The URL of the remote MCP server"),
//         }),
//       }
//     );

//   const disconnectFromMcpServer = tool(
//       async ({ url }) => {
//         console.log(`agent called close_connection_to_mcp_server with url ${url}`);
//         try {
//           const connection = this.activeConnections.get(url);
//           if(!connection) {
//             console.log("Connection wasn't found")
//             return JSON.stringify({
//               status: "404"
//             })
//           }
//           console.log("obtained connection, attempting to disconnect")
//           await connection.client.close()
//           await connection.transport.close();
//           this.activeConnections.delete(url);
//           return JSON.stringify({
//             status: "200",
//           });
//         } catch (err: any) {
//           console.log("Disconnect failed")
//           return JSON.stringify({
//             status: "500",
//           });
//         }
//       },
//       {
//         name: "disconnect_from_mcp_server",
//         description:
//           "This tool disconnects from a remote MCP server and you MUST call this when you are done with a remote MCP server. If you receive a status of 200 the disconnect was a success. If you receive a 500 the disconnect failed and you should notify the user.",
//         schema: z.object({
//           url: z.string().describe("The URL of the remote MCP server that you wish to disconnect from"),
//         }),
//       }
//     );
    
//     const useExternalTool = tool(
//       async ({ serverUrl, toolName, toolArgs }) => {
//         console.log("going to use external tool")
//         const toolArgsString = JSON.stringify(toolArgs);
//         console.log(`agent invoking use_external_tool with ${toolName} on ${serverUrl} with args ${toolArgsString}`);

//         const connection = this.activeConnections.get(serverUrl);
//         if (!connection) {
//           console.log("The agent wasn't connected")
//           return JSON.stringify({
//             status: "error",
//             message: `Not connected to ${serverUrl}. Call connect_to_mcp_server first.`,
//           });
//         }

//         const remoteTool = connection.tools.get(toolName);
//         if (!remoteTool) {
//           console.log("The tool doesnt exist")
//           return JSON.stringify({
//             status: "error",
//             message: `Tool '${toolName}' not found on ${serverUrl}. Available: ${Array.from(connection.tools.keys()).join(", ")}`,
//           });
//         }

//         try {
//           console.log("Calling tool...")
//           const result = await connection.client.callTool({
//             name: toolName,
//             arguments: toolArgs,
//           });
//            console.log("Call succeeded", JSON.stringify(result));
//           return JSON.stringify({ status: "success", result });
//         } catch (err: any) {
//           console.log("Call failed", err);
//           return JSON.stringify({
//             status: "error",
//             message: err.message ?? String(err),
//           });
//         }
//       },
//       {
//         name: "use_external_tool",
//         description:
//           "This tool calls a tool on a remote MCP server you have already connected to via connect_to_mcp_server.",
//         schema: z.object({
//           serverUrl: z
//             .string()
//             .describe("The URL of the MCP server (must already be connected)"),
//           toolName: z
//             .string()
//             .describe("The name of the tool to invoke on the remote server"),
//           toolArgs: z
//             .record(z.any(), z.any())
//             .describe("A JSON object of arguments to pass to the remote tool"),
//         }),
//       }
//     );

    // return [getAgentCards, callDatasourceAgent, x402f, connectToMcpServer, useExternalTool, disconnectFromMcpServer];
        // return [getAgentCards, callDatasourceAgent, x402f];

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