import { DynamicStructuredTool, tool } from "langchain";
import { FangornToolboxConfig, Toolbox } from "@fangorn-network/agent-types";
import { z } from "zod";
import { resolve } from "path";
import { buildCodingTools } from "./tools.js";
import { getToolsByName } from "../utils.js";

export class CodingToolbox implements Toolbox {
  // Note: some models (qwen3) refuse to call noun-named meta-tools like
  // "coding_toolbox"; the verb form is reliably invoked in full-agentic mode.
  public name = "activate_coding_tools";

  private tools: DynamicStructuredTool[];
  private workspaceRoot: string;

  static async init(config: FangornToolboxConfig): Promise<CodingToolbox> {
    const workspaceRoot = resolve(config?.workspaceRoot ?? process.cwd());
    return new CodingToolbox(workspaceRoot);
  }

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.tools = buildCodingTools(workspaceRoot);
    console.log(`[codingToolbox] Workspace root: ${workspaceRoot}`);
  }

  getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool> {
    return getToolsByName(this.getTools(), toolNames);
  }

  getTools(): DynamicStructuredTool[] {
    return this.tools;
  }

  public getToolboxAsTool(): DynamicStructuredTool {
    const codingToolboxTool = tool(
      async () => {
        console.log("console.log - agent called codingToolboxTool tool");

        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            `Coding tools are now available for the workspace at ${this.workspaceRoot}. ` +
            "You now have access to: read_file, list_directory, find_files, search_code, " +
            "write_file, edit_file, and run_command. Re-plan and use them to complete the task.",
        });
      },
      {
        name: this.name,
        description:
          "Activate the tools for software development: read, list, find, search, write, and edit files in the user's workspace, and run shell commands.",
        schema: z.object({}),
      },
    );
    return codingToolboxTool;
  }
}
