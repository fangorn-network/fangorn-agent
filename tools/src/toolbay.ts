import { DynamicStructuredTool } from "@langchain/core/tools";
import {
  DataContext,
  FangornAgentToolConfig,
  McpUiResult,
  Toolbox,
  ToolboxPlugin,
} from "agent-types";

import { buildSummary, processToolResult } from "./utils.js";
import { activateToolboxPlugins } from "./toolboxes/utils.js";

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
    config: FangornAgentToolConfig,
  ): Promise<ToolBay> {
    let toolboxes = await activateToolboxPlugins(config, dataContextProvider);
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
      let activatedTools = this.toolboxes.map((tb) =>
        tb.getToolsByName(toolNames),
      );
      this.currentTools = new Map(activatedTools.flatMap((m) => [...m]));
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
      // toolArgs["exludeIds"] = excludeIdsSW
    }

    console.log(`Executing tool: ${toolName}`);
    const result = await tool!.invoke(toolArgs);
    const { finalResult, mcpData } = processToolResult(result, toolName);

    if (mcpData) this.mcpData = mcpData;
    console.log("Tool call was executed. Here are the results:");
    console.log(JSON.stringify(result, null, 2));

    return finalResult;
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

  public getAllToolBoxNames(): string[] {
    return this.toolboxes.map((tb) => tb.name);
  }

  public getToolBoxToolNamesMap(): Map<string, string[]> {
    const toolBoxToolNamesMap = new Map();
    this.toolboxes.forEach((tb) => {
      const tbName = tb.name;
      const tools = tb.getTools();
      const toolNames = tools.map((t) => t.name);
      console.log(`setting ${tbName}:${toolNames}`);
      toolBoxToolNamesMap.set(tbName, toolNames);
    });
    return toolBoxToolNamesMap;
  }
}
