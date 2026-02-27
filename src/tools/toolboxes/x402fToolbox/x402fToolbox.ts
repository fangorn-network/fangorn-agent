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
            "Agent tools are now available. You now have access to: search_agents, get_agent_card, call_x402f_agent. Re-plan and use them to complete the task.",
        });
      },
      {
        name: this.name,
        description:
          "Access agent tools for searching agents, retrieving agent cards, and calling x402f-enabled agents. Call this first before attempting any agent related tasks.",
        schema: z.object({}),
      },
    );
    return fangornAgentToolboxTool;
  }

  public getTools(): DynamicStructuredTool[] {
    const searchAgents = tool(
      async ({ agentName }) => {
        console.log(
          `console.log - agent called searchAgents tool using agent name: ${agentName}`,
        );
        try {
          const agentResults = await this.agent0Sdk.searchAgents({
            name: agentName,
            chains: [arbitrumSepoliaChainId],
          });

          if (agentResults.length > 0) {
            return JSON.stringify({
              status: 200,
              statusText: "OK",
              agentResults,
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
        name: "search_agents",
        description: "Look for agents that can complete user requests",
        schema: z.object({
          agentName: z.string().describe("The name of the agent to find"),
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
          "Finds an agent's agent card for more information about them",
        schema: z.object({
          a2aUrl: z
            .string()
            .describe("The url advertised in the a2a field by the agent"),
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
          fs.writeFileSync(`./Downloads/${tag}`, dataContents, "binary");
          return JSON.stringify({
            status: 200,
            statusText: "OK",
            result: `Notify the user that the request file has been downloaded to Downloads/${tag}`,
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
        description: "Call an x402f enabled agent",
        schema: z.object({
          agentName: z
            .string()
            .describe("Name of the agent that provides the data"),
          tag: z.string().describe("Name of the file the user is looking for"),
          agentCardUrl: z
            .string()
            .describe("URL that is advertised in an agent's agent card"),
          owner: z
            .string()
            .describe("The address advertised in the owner field by the agent"),
        }),
      },
    );

    return [searchAgents, getAgentCard, callx402fAgent];
  }
}
