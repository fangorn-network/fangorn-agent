import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { Toolbox } from "../../types.js";
import { arbitrumSepoliaChainId } from "../../../constants.js";
import { SDK } from "agent0-sdk";
import { getAgent0Sdk } from "./utils.js";
import { agent0SdkConfig, appConfig } from "../../../config.js";

export class Agent0Toolbox implements Toolbox {
  private agent0Sdk: SDK;
  public name: string = "agent0-toolbox";

  static async init(): Promise<Agent0Toolbox> {

		const {pinataJwt, appConfig, key} = agent0SdkConfig;

    const agent0Sdk = getAgent0Sdk(appConfig, key, pinataJwt);


    return new Agent0Toolbox(agent0Sdk);
  }

  constructor(agent0Sdk: SDK) {
    this.agent0Sdk = agent0Sdk;
  }

  public getToolboxAsTool(): DynamicStructuredTool {
    const agent0ToolboxTool = tool(
      async () => {
        console.log("console.log - agent called agent0ToolboxTool tool");

        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            "Agent tools are now available. You now have access to: search_agents_erc_8004 and get_agent_card. Re-plan and use them to complete the task.",
        });
      },
      {
        name: this.name,
        description:
          "Access agent tools for searching agents and retrieving agent cards. Call this before attempting any agent related tasks.",
        schema: z.object({}),
      },
    );
    return agent0ToolboxTool;
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

    return [searchAgentsErc8004, getAgentCard];
  }
}
