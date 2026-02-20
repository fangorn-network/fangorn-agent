import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { LocalAgentMcp } from "./mcpClient.js";
import { z } from "zod";
import { SDK } from "agent0-sdk";
import { FangornConfig } from "fangorn-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { Chain, createWalletClient, Hex, http } from "viem";
import { createFangornMiddleware, FangornX402Middleware } from "x402f";

async function main() {

  const {x402fClient, agent0Sdk} = await initializeClients();

  const server = new McpServer({
    name: "local-agent-mcp",
    version: "1.0.0",
  });
  // await LocalAgentMcp.create(server);

  const app = express();
  app.use(express.json());

  // Health check endpoint — the LLM container will poll this
  app.get("/health", (_, res) => res.json({ status: "ok" }));

  app.post("/mcp", async (req, res) => {
    const server = new McpServer({
      name: "local-agent-mcp",
      version: "1.0.0",
    });

    registerTools(server, x402fClient, agent0Sdk)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const PORT = process.env.MCP_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`MCP server listening on port ${PORT}`);
  });
}

function registerTools(server: McpServer, x402fClient: FangornX402Middleware, agent0Sdk: SDK) {

  server.registerTool(
    "search_agents",
    {
      description:
        "This tool finds agents that are registered in an ERC-8004 compliant manner. Use this when looking for agents to fulfill requests. You MUST remember the agentId and the owner for the agent you choose.",
      inputSchema: {
        agentName: z
          .string()
          .describe("This is the name of the agent that you think has what you need."),
      },
    },
    async ({ agentName }) => {
      console.log(`console.log - agent called searchAgents tool using agent name: ${agentName}`);
      try {
        const agentResults = await agent0Sdk.searchAgents({
          name: agentName,
          chains: [421614],
        });
        return {
          content: [{ type: "text", text: JSON.stringify(agentResults) }],
        };
      } catch (error) {
        console.log("Something went wrong: ", error);
        return {
          content: [{ type: "text", text: JSON.stringify(error) }],
          isError: true,
        };
      }
    }
  );
  
  server.registerTool(
    "get_agent_card",
    {
      description:
        "This tool fetches the agent card for the agent that can possibly fulfill your request. If you receive a status of 404 then either the agent doesn't exist, or you passed in an incorrect URL.",
      inputSchema: {
        a2aEndpoint: z
          .string()
          .describe(
            "This is the URL to call in order to obtain an agent card to communicate with the agent returned from the search_agents tool."
          ),
      },
    },
    async ({ a2aEndpoint }) => {
      console.log(`console.log - agent called getAgentCard tool with a2aEndpoint: ${a2aEndpoint}`);
      const result = await fetch(`${a2aEndpoint}/.well-known/agent-card.json`);
      const body = await result.json();
      return {
        content: [{ type: "text", text: JSON.stringify(body) }],
      };
    }
  );
  
  server.registerTool(
    "call_x402f_agent",
    {
      description:
        "This tool calls an x402f enabled agent using information from their agent card. Use this tool if you need to call an x402f based datasource agent. A status of 200 means that the file has been obtained. Any other status means the request couldn't be fulfilled.",
      inputSchema: {
        agentName: z
          .string()
          .describe("This is the name of the agent that provides the data"),
        tag: z
          .string()
          .describe("This is the name of the file the user is looking for"),
        agentCardUrl: z
          .string()
          .describe("This is the URL that is advertised in the agent card"),
        owner: z
          .string()
          .describe("This is the owner of the datasource agent"),
      },
    },
    async ({ agentName, tag, agentCardUrl, owner }) => {
      console.log(
        `console.log - Agent called callx402fAgent tool with args: agentName: ${agentName}, file tag: ${tag}, urlbeingcalled: ${agentCardUrl}`
      );
  
      if (agentCardUrl.startsWith("ipfs")) {
        return {
          content: [
            {
              type: "text",
              text: "It appears you passed in an ipfs URI. The required URL should have come from the agent card itself.",
            },
          ],
          isError: true,
        };
      }
  
      const hexId = owner as Hex;
  
      const result = await x402fClient.fetchResource({
        datasourceName: agentName,
        tag,
        baseUrl: agentCardUrl,
        owner: hexId,
      });
  
      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: 200,
                filename: tag,
                filecontents: atob(result.dataString!),
              }),
            },
          ],
        };
      } else {
        return {
          content: [{ type: "text", text: JSON.stringify({ status: "500" }) }],
          isError: true,
        };
      }
    }
  );

}

async function initializeClients () {

  const key = process.env.ETH_PRIVATE_KEY;
    if (!key) throw new Error("No private key found");
    const envChain = process.env.CHAIN;
    console.log("chain: ", envChain);
    if (!envChain) throw new Error("No chain specified");
    const config =
      envChain == "arbitrumSepolia"
        ? FangornConfig.ArbitrumSepolia
        : FangornConfig.BaseSepolia;

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) throw new Error("No pinataJWT provided");
    const pinataGateway = process.env.PINATA_GATEWAY;
    if (!pinataGateway) throw new Error("No pinataGateway provided");

    const account = privateKeyToAccount(key as Hex);
    const walletClient = createWalletClient({
      account,
      chain: config.chain as Chain | undefined,
      transport: http(config.rpcUrl),
    });

    const domain = "localhost";

    const x402fClient = await createFangornMiddleware(
      walletClient,
      config,
      domain,
      pinataJwt,
      pinataGateway,
    );

    let agent0Sdk: SDK;

    if (config.chain.id === 421614) {
      const registryOverrides = {
        421614: {
          IDENTITY: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
          REPUTATION: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
        },
      };
      const subgraphOverrides = {
        421614:
          "https://api.studio.thegraph.com/query/1742225/erc-8004-arbitrum-sepolia/version/latest",
      };
      agent0Sdk = new SDK({
        chainId: 421614,
        rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
        subgraphUrl:
          "https://api.studio.thegraph.com/query/1742225/erc-8004-arbitrum-sepolia/version/latest",
        registryOverrides,
        subgraphOverrides,
        ipfs: "pinata",
        pinataJwt,
        privateKey: key,
      });
    } else {
      agent0Sdk = new SDK({
        chainId: config.chain.id,
        rpcUrl: config.chain.rpcUrls.default.http[0],
        ipfs: "pinata",
        pinataJwt,
        privateKey: key,
      });
    }

    return {x402fClient, agent0Sdk}
}

main().catch(console.error);