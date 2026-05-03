import { DynamicStructuredTool, tool } from "langchain";
import { Toolbox } from "../../types.js";
import { z } from "zod";
import { readTaste, readTasteForUpdate, updateTaste } from "./tools.js";
import { getToolsByName } from "../utils.js";

export class TasteToolbox implements Toolbox {
  public name = "taste_toolbox";

  static async init(): Promise<TasteToolbox> {
    return new TasteToolbox();
  }

  constructor() {}

	getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool> {
		const matchingToolMap = getToolsByName(this.getTools(), toolNames)
		return matchingToolMap;
	}

  getTools(): DynamicStructuredTool[] {
    return [readTaste, readTasteForUpdate, updateTaste];
  }

  public getToolboxAsTool(): DynamicStructuredTool {
    const tasteToolboxTool = tool(
      async () => {
        console.log("console.log - agent called tasteToolboxTool tool");

        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            "Taste tools are now available. You now have access to: read_taste and update_taste. Re-plan and use them to complete the task.",
        });
      },
      {
        name: this.name,
        description:
          "Access tools that allow you to learn about the user's taste and update what you know about it.",
        schema: z.object({}),
      },
    );
    return tasteToolboxTool;
  }
}
