import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { FangornAgentToolConfig, Toolbox } from "agent-types";
import { createAgent0Tools } from "./tools.js";
import { getToolsByName } from "../utils.js";

export class Agent0Toolbox implements Toolbox {
  public name: string = "agent0-toolbox";
  private tools: DynamicStructuredTool[];

  static async init(config: FangornAgentToolConfig): Promise<Agent0Toolbox> {
    const tools: DynamicStructuredTool[] = createAgent0Tools(
      config.agent0SdkToolConfig,
    );
    return new Agent0Toolbox(tools);
  }

  constructor(tools: DynamicStructuredTool[]) {
    this.tools = tools;
  }

  getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool> {
    const matchingToolMap = getToolsByName(this.getTools(), toolNames);
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
    return this.tools;
  }
}
