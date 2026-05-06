import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  FangornAgentToolConfig,
  FangornToolConfig,
  Toolbox,
} from "agent-types";
import { createX402FetchTool } from "./tools.js";
import { getToolsByName } from "../utils.js";

export class FangornToolbox implements Toolbox {
  public name: string = "x402f_toolbox";
  private x402Fetch: DynamicStructuredTool;

  dataContextProvider: (() => any) | null = null;

  static async init(config: FangornAgentToolConfig): Promise<FangornToolbox> {
    const x402Fetch = await createX402FetchTool(config.fangornToolConfig);
    return new FangornToolbox(x402Fetch);
  }

  constructor(x402Fetch: DynamicStructuredTool) {
    this.x402Fetch = x402Fetch;
  }

  public setDataContextProvider(dataContextProvider: () => any) {
    this.dataContextProvider = dataContextProvider;
  }

  getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool> {
    const matchingToolMap = getToolsByName(this.getTools(), toolNames);
    return matchingToolMap;
  }

  // Unused for now, but keeping here for the future
  private getData(): any {
    if (!this.dataContextProvider) {
      throw new Error("No data provider set");
    }
    return this.dataContextProvider();
  }

  public getToolboxAsTool(): DynamicStructuredTool {
    const x402fToolboxTool = tool(
      async () => {
        console.log("console.log - agent called x402fToolboxTool tool");

        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            "x402f tools are now available. You now have access to: x402f_fetch. Re-plan and use them to complete the task.",
        });
      },
      {
        name: this.name,
        description:
          "Activates the x402f toolbox, which provides tools for purchasing and decrypting files. Call this whenever the user wants to buy or decrypt a resource. Once called, you will gain access to the x402f_fetch tool.",
        schema: z.object({}),
      },
    );
    return x402fToolboxTool;
  }

  public getTools(): DynamicStructuredTool[] {
    return [this.x402Fetch];
  }
}
