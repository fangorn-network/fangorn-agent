import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { Toolbox } from "../../types.js";
import { getAgentCard, searchAgentsErc8004 } from "./tools.js";
import { getToolsByName } from "../utils.js";

export class Agent0Toolbox implements Toolbox {
  public name: string = "agent0-toolbox";

  static async init(): Promise<Agent0Toolbox> {
    return new Agent0Toolbox();
  }

  getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool> {
    const matchingToolMap = getToolsByName(this.getTools(), toolNames)
    return matchingToolMap;
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
    return [searchAgentsErc8004, getAgentCard];
  }
}
