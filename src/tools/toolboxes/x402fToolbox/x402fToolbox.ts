import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { Chain, createWalletClient, Hex, http, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createFangornMiddleware, FangornX402Middleware } from "x402f";
import { SDK } from "agent0-sdk";
import fs from "fs";
import { Toolbox } from "../../types.js";
import { arbitrumSepoliaChainId } from "../../../constants.js";
import { x402fToolboxConfig } from "../../../config.js";
import { getAgent0Sdk } from "./utils.js";

export class x402fToolbox implements Toolbox {
  private agent0Sdk: SDK;
  private x402fClient: FangornX402Middleware;
  public name: string = "x402f_toolbox";

  static async init(): Promise<x402fToolbox> {
    const key = x402fToolboxConfig.key;
    const config = x402fToolboxConfig.fangornConfig;
    const pinataJwt = x402fToolboxConfig.pinataJwt;
    const pinataGateway = x402fToolboxConfig.pinataGateway;
    const domain = x402fToolboxConfig.domain;

    const walletClient = createWalletClient({
      account: privateKeyToAccount(key as Hex),
      chain: config.chain as Chain | undefined,
      transport: http(config.rpcUrl),
    });

    const x402fClient = await createFangornMiddleware(
      walletClient,
      config,
      domain,
      pinataJwt,
      pinataGateway,
    );

    const agent0Sdk: SDK = getAgent0Sdk(config, key, pinataJwt);

    return new x402fToolbox(x402fClient, agent0Sdk);
  }

  constructor(x402fClient: FangornX402Middleware, agent0Sdk: SDK) {
    this.agent0Sdk = agent0Sdk;
    this.x402fClient = x402fClient;
  }

  public getToolboxAsTool(): DynamicStructuredTool {
    const fangornAgentToolboxTool = tool(
      async () => {
        console.log("console.log - agent called fangornAgentToolboxTool tool");

        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            "Agent tools are now available. You now have access to: search_agents_erc_8004, get_agent_card, call_x402f_agent. Re-plan and use them to complete the task.",
        });
      },
      {
        name: this.name,
        description:
          "Access agent tools for searching agents, retrieving agent cards, and calling x402f-enabled agents. Call this before attempting any agent related tasks.",
        schema: z.object({}),
      },
    );
    return fangornAgentToolboxTool;
  }

  public getTools(): DynamicStructuredTool[] {
    const searchAgentsErc8004 = tool(
      async ({ agentName }) => {
        console.log(
          `console.log - agent called searchAgentsErc8004 tool using agent name: ${agentName}`,
        );
        try {
          const erc8004Entry = await this.agent0Sdk.searchAgents({
            name: agentName,
            chains: [arbitrumSepoliaChainId],
          });

          if (erc8004Entry.length > 0) {
            return JSON.stringify({
              status: 200,
              statusText: "OK",
              erc8004Entry,
            });
          } else {
            return JSON.stringify({ status: 204, statusText: "No Content" });
          }
        } catch (error) {
          console.log("Something went wrong: ", error);
          return JSON.stringify(error);
        }
      },
      {
        name: "search_agents_erc_8004",
        description: "Finds agents that can complete user requests and retrieves their ERC-8004 entry.",
        schema: z.object({
          agentName: z.string().describe("The name of the agent to find."),
        }),
      },
    );

    const getAgentCard = tool(
      async ({ a2aUrl }) => {
        console.log(
          `console.log - agent called getAgentCard tool with url: ${a2aUrl}`,
        );
        const response = await fetch(`${a2aUrl}/.well-known/agent-card.json`);
        const result = await response.json();
        return JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          agentCard: result,
        });
      },
      {
        name: "get_agent_card",
        description:
          "Finds an agent's agent card, after obtaining their ERC-8004 entry, for more information about them. Always use this after using the search_agents_erc_8004 tool.",
        schema: z.object({
          a2aUrl: z
            .string()
            .describe("The https url advertised in the a2a field of the ERC-8004 entry."),
        }),
      },
    );

    const callx402fAgent = tool(
      async ({ agentName, tag, agentCardUrl, owner }) => {
        console.log(
          `console.log - Agent called callx402fAgent tool with args: agentName: ${agentName}, file tag: ${tag}, urlbeingcalled: ${agentCardUrl}, and owner: ${owner}`,
        );

        const hexId = owner as Hex;

        const result = await this.x402fClient.fetchResource({
          datasourceName: agentName,
          tag,
          baseUrl: agentCardUrl,
          owner: hexId,
        });
        if (result.success) {
          const dataContents = atob(result.dataString!);
          fs.mkdirSync('./Downloads', { recursive: true });
          fs.writeFileSync(`./Downloads/${tag}`, dataContents, "binary");
          return JSON.stringify({
            status: 200,
            statusText: "OK",
            result: `Notify the user that the request file has been downloaded to Downloads/${tag}.`,
          });
        } else {
          return JSON.stringify({
            status: 500,
            result:
              "Notify the user that when you went to fetch the file, something went wrong.",
          });
        }
      },
      {
        name: "call_x402f_agent",
        description: "Call an x402f enabled agent.",
        schema: z.object({
          agentName: z
            .string()
            .describe("Name of the agent that provides the data."),
          tag: z.string().describe("Name of the file the user is looking for."),
          agentCardUrl: z
            .string()
            .describe("The https URL that is advertised in the agent's agent card."),
          owner: z
            .string()
            .describe("The address advertised in the owner field by the agent's ERC-8004 entry."),
        }),
      },
    );

    return [searchAgentsErc8004, getAgentCard, callx402fAgent];
  }
}
