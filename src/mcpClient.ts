import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import dotenv from "dotenv";
import { Chain, createWalletClient, Hex, http, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { FangornConfig } from "fangorn-sdk";
import { createFangornMiddleware, FangornX402Middleware } from "x402f";
import { SDK } from "agent0-sdk";

dotenv.config();

export class LocalAgentMcp {
  private agent0Sdk: SDK;
  private localTools: DynamicStructuredTool[];
  private x402fClient: FangornX402Middleware;

  static async create(): Promise<LocalAgentMcp> {
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

    return new LocalAgentMcp(x402fClient, agent0Sdk);
  }

  constructor(x402fClient: FangornX402Middleware, agent0Sdk: SDK) {
    this.localTools = this.buildTools();
    this.agent0Sdk = agent0Sdk;
    this.x402fClient = x402fClient;
  }

  getLocalTools(): DynamicStructuredTool[] {
    return this.localTools;
  }

  private buildTools(): DynamicStructuredTool[] {
    const searchAgents = tool(
      async ({ agentName }) => {
        console.log(
          `console.log - agent called searchAgents tool using agent name: ${agentName}`,
        );
        try {
          const agentResults = await this.agent0Sdk.searchAgents({
            name: agentName,
            chains: [421614],
          });
          return JSON.stringify(agentResults);
        } catch (error) {
          console.log("Something went wrong: ", error);
          return JSON.stringify(error);
        }
      },
      {
        name: "search_agents",
        description:
          "This tool finds agents that are registered in an ERC-8004 compliant manner. Use this when looking for agents to fulfill requests. You MUST remember the agentId and the owner for the agent you choose.",
        schema: z.object({
          agentName: z
            .string()
            .describe(
              "This is the name of the agent that you think has what you need.",
            ),
        }),
      },
    );

    const getAgentCard = tool(
      async ({ a2aEndpoint }) => {
        console.log(
          `console.log - agent called getAgentCard tool with a2aEndpoint: ${a2aEndpoint}`,
        );
        const result = await fetch(
          `${a2aEndpoint}/.well-known/agent-card.json`,
        );
        return JSON.stringify(result);
      },
      {
        name: "get_agent_card",
        description:
          "This tool fetches the agent card for the agent that can possibly fulfill your request. If you receive a status of 404 then either the agent doesn't exist, or you passed in an incorrect URL.",
        schema: z.object({
          a2aEndpoint: z
            .string()
            .describe(
              "This is the URL to call in order to obtain an agent card to communicate with the agent returned from the search_agents tool.",
            ),
        }),
      },
    );

    const callx402fAgent = tool(
      async ({ agentName, tag, agentCardUrl, owner }) => {
        console.log(
          `console.log - Agent called callx402fAgent tool with args: agentName: ${agentName}, file tag: ${tag}, urlbeingcalled: ${agentCardUrl}`,
        );

        if (agentCardUrl.startsWith("ipfs")) {
          return "It appears you passed in an ipfs URI. The required URL should have come from the agent card itself.";
        }

        const hexId = owner as Hex;

        const result = await this.x402fClient.fetchResource({
          datasourceName: agentName,
          tag,
          baseUrl: agentCardUrl,
          owner: hexId,
        });
        if (result.success) {
          return JSON.stringify({
            status: 200,
            filename: tag,
            filecontents: atob(result.dataString!),
          });
        } else {
          return JSON.stringify({ status: "500" });
        }
      },
      {
        name: "call_x402f_agent",
        description:
          "This tool calls an x402f enabled agent using information from their agent card, NOT from their. Use this tool if you need to call an x402f based datasource agent. A status of 200 means that the file has been obtained. Any other status means the request couldnt be fulfilled.",
        schema: z.object({
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
        }),
      },
    );

    return [searchAgents, getAgentCard, callx402fAgent];
  }
}
