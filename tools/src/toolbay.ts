import { DynamicStructuredTool } from "@langchain/core/tools";
import { GmailToolbox } from "./toolboxes/gmailToolbox/GmailToolbox.js";
import { DataContext, FangornAgentToolConfig, initializeToolbox, Toolbox } from "./types.js";
import { McpToolbox } from "./toolboxes/mcpToolbox/mcpToolbox.js";
import { FangornToolbox } from "./toolboxes/fangornToolbox/fangornToolbox.js";
import {
  buildFangornMusicPromptResponse,
} from "./prompts.js";
import { TasteToolbox } from "./toolboxes/tasteToolbox/tasteToolbox.js";
import { buildSummary } from "./utils.js";

// Examples of a toolbox:
// Web3 toolbox: wallets, signing, funds, etc.
// Websearch toolbox: google queries, using other LLMs for queries
// Filesystem toolbox
// etc.
// Toolboxes are a collection of tools that are local to the agent.
// Tool names whose raw results should be forwarded to the frontend

export interface McpUiResult {
  toolName?: string;
  resultType?: string;
  data?: any;
}

export class ToolBay {
  private currentTools: Map<String, DynamicStructuredTool> = new Map();
  private toolboxes: Toolbox[];
  private agenticToolboxMapping: Map<string, number> = new Map();

  // Accumulated MCP results that should be forwarded to the frontend
  private mcpData: McpUiResult = {};

  // The toolbay is always dirty after initialization. This will guarantee
  // that the model will have new tools bound on first invocation.
  private dirty = true;

  private agenticChat = false;

  dataContextProvider: (() => DataContext) | null = null;

  static async initToolbay(
    dataContextProvider: () => DataContext,
		fangornAgentToolConfig: FangornAgentToolConfig,
  ): Promise<ToolBay> {
    const toolboxes: Toolbox[] = [];

    if (fangornAgentToolConfig.mcpServerConfig.enabled) {
      const fangornMcpUrl =
        fangornAgentToolConfig.mcpServerConfig.mcpServerUrls ?? ["http://localhost:4000"];
      const mcpToolbox = await McpToolbox.init(
        {
          fangornMcp: {
            transport: "http",
            url: fangornMcpUrl[0],
          },
        },
        "mcp_toolbox",
      );
      toolboxes.push(mcpToolbox);
    }
    if (fangornAgentToolConfig.gmailConfig.enabled) {
      const gmailToolbox = await initializeToolbox(GmailToolbox, fangornAgentToolConfig);
      toolboxes.push(gmailToolbox);
    }
		if (fangornAgentToolConfig.useTasteTools) {
    	const tasteToolbox = await initializeToolbox(TasteToolbox, fangornAgentToolConfig);
    	toolboxes.push(tasteToolbox);
		}
		if (fangornAgentToolConfig.fangornToolConfig.enabled) {
    	const fangornToolbox = await initializeToolbox(FangornToolbox, fangornAgentToolConfig);
    	const fangornToolboxImpl = fangornToolbox as FangornToolbox;
    	fangornToolboxImpl.setDataContextProvider(dataContextProvider);
    	toolboxes.push(fangornToolbox);
		}

    return new ToolBay(toolboxes, dataContextProvider);
  }

  constructor(toolboxes: Toolbox[], dataContextProvider: () => DataContext) {
    this.toolboxes = toolboxes;
    toolboxes.forEach((tb, index) =>
      this.agenticToolboxMapping.set(tb.name, index),
    );
    this.dataContextProvider = dataContextProvider;
  }

  async activateAgenticTools() {
    console.log(
      "Agentic tools activated. The agent has full control over tools and toolboxes.",
    );
    this.toolboxes.forEach((tb) => {
      this.currentTools.set(tb.name, tb.getToolboxAsTool());
    });
    this.agenticChat = true;
  }

  async activateTools(toolNames: string[]) {
    console.log(`Specific tools activated: ${toolNames}`);
    if (toolNames.length > 0) {
      this.dirty = true;
      let activeTools = this.toolboxes.map((tb) =>
        tb.getToolsByName(toolNames),
      );
      this.currentTools = new Map(activeTools.flatMap((m) => [...m]));
      console.log("currentTools:", [...this.currentTools.keys()]);
    } else {
      console.warn(
        "No tools activated. The agent will not use tools on this request.",
      );
    }
  }

  private getExcludedIds(): string[] {
    if (!this.dataContextProvider) {
      console.error("No data provider has been set");
      throw new Error("No data provider set");
    }
    const dataContext = this.dataContextProvider();
    return dataContext.excludeIds ?? [];
  }

  async invokeToolcall(toolName: string, toolArgs: any): Promise<any> {
    if (this.agenticChat && this.agenticToolboxMapping.has(toolName)) {
      const toolboxIndex = this.agenticToolboxMapping.get(toolName);
      const toolbox = this.toolboxes.at(toolboxIndex!);
      this.inject(toolbox!.getTools(), toolName);
    }

    if (!this.currentTools.has(toolName)) {
      console.error("Tool called that doesn't exist.");
      throw new Error(`Tool with name ${toolName} doesn't exist.`);
    }

    const tool = this.currentTools.get(toolName);

    const excludeIds = this.getExcludedIds();

    if (excludeIds.length > 0) {
      console.log(
        "TODO: There were IDS to be excluded. Implement adding tools to tool args.",
      );
      console.log("Excluded ids: ", excludeIds);
      // Example of toolArgs:
      // {"fieldName":"genre","fieldValue":"Jazz","caseSensitive":false,"first":9}
      // this so if we wanted to exclude file ids we would do something like
      // toolArgs["exludeIds"] = excludeIds
    }

    console.log(`Executing tool: ${toolName}`);

    let result = await tool!.invoke(toolArgs);
    const parsed = JSON.parse(result);
    let displayData = parsed.displayData;

    // If this is an MCP tool whose data should be rendered in the UI,
    // stash the parsed result so the server can forward it to the frontend.
    if (displayData) {
      try {
        const data: any = parsed.data;
        const resultType: string = parsed.resultType;

        if (resultType !== "non-standard") {
          const count = Array.isArray(data) ? data.length : 1;
          const summary = buildSummary(data, resultType);
          result = buildFangornMusicPromptResponse(count, resultType, summary);
          console.log(
            `result summary given to agent: ${JSON.stringify(result, null, 2)}`,
          );
        } else {
          console.log("It was non-standard");
          console.log("resultType");
          result = `${result} \n\nIt looks like you made a raw query. The user will not get to see the full data in the UI.`;
        }

        this.mcpData = { toolName, data, resultType };
      } catch {
        // If it doesn't parse, skip — the model still gets the string
        console.log(
          `[ToolBay] Could not parse MCP result for UI forwarding. Raw type: ${typeof result}, preview: ${String(result).slice(0, 200)}`,
        );
      }
    }

    console.log("Tool call was executed. Here are the results:");
    console.log(JSON.stringify(result, null, 2));

    return result;
  }

  inject(newTools: DynamicStructuredTool[], toolToRemove?: string) {
    newTools.forEach((t) => this.currentTools.set(t.name, t));
    if (toolToRemove) {
      console.log("removing toolbox from avaialable tools");
      this.currentTools.delete(toolToRemove);
    }
    this.dirty = true;
  }

  containsTool(toolName: string) {
    return this.currentTools.has(toolName);
  }

  consumeDirty() {
    this.dirty = false;
    return Array.from(this.currentTools.values());
  }

  isDirty() {
    return this.dirty;
  }

  resetToolBay() {
    console.log("console.log - reset toolbay");
    this.currentTools.clear();
    this.dirty = true;
    this.agenticChat = false;
  }

  /**
   * Returns and clears any accumulated MCP results that should
   * be forwarded to the frontend for rich UI rendering.
   */
  consumeMcpResults(): McpUiResult {
    const data = this.mcpData;
    this.mcpData = {};
    return data;
  }

  public getAllToolNames(): string[] {
    return this.toolboxes.flatMap((tb) =>
      tb.getTools().map((t) => `${t.name}: ${t.description}`),
    );
  }
}
