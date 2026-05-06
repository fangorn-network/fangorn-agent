import { DynamicStructuredTool, tool } from "langchain";
import { arbitrumSepoliaChainId } from "../../constants.js";
// import { getAgent0Sdk } from "./utils.js";
// import { agent0SdkConfig } from "../../config.js";
import { z } from "zod";
import { Agent0SdkToolConfig } from "agent-types";
import { getAgent0Sdk } from "./utils.js";

export function createAgent0Tools(
  agent0SdkToolConfig: Agent0SdkToolConfig,
): DynamicStructuredTool[] {
  const agent0Sdk = getAgent0Sdk(agent0SdkToolConfig);

  const searchAgentsErc8004 = tool(
    async ({ agentName }) => {
      console.log(
        `console.log - agent called searchAgentsErc8004 tool using agent name: ${agentName}`,
      );
      try {
        const erc8004Entry = await agent0Sdk.searchAgents({
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
      description:
        "Finds agents that can complete user requests and retrieves their ERC-8004 entry.",
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
          .describe(
            "The https url advertised in the a2a field of the ERC-8004 entry.",
          ),
      }),
    },
  );

  return [searchAgentsErc8004, getAgentCard];
}
