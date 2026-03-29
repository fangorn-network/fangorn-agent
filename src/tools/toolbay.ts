import { DynamicStructuredTool } from "@langchain/core/tools";
// import { x402fToolbox } from "./toolboxes/x402fToolbox/x402fToolbox.js";
import { GmailToolbox } from "./toolboxes/gmailToolbox/GmailToolbox.js";
import { initializeToolbox, Toolbox } from "./types.js";
import { McpToolbox } from "./toolboxes/mcpToolbox/mcpToolbox.js";

// Examples of a toolbox:
// Web3 toolbox: wallets, signing, funds, etc.
// Websearch toolbox: google queries, using other LLMs for queries
// Filesystem toolbox
// etc.
// Toolboxes are a collection of tools that are local to the agent.
// Tool names whose raw results should be forwarded to the frontend
const MCP_UI_TOOLS = new Set([
  "subgraph_list_schemas",
  "subgraph_query_data",
]);

export interface McpUiResult {
  toolName: string;
  data: any;
}

export class ToolBay {
  private currentTools: Map<string, DynamicStructuredTool> = new Map();
  private toolboxes: Map<string, Toolbox> = new Map();

  // Accumulated MCP results that should be forwarded to the frontend
  private mcpResults: McpUiResult[] = [];

  // The toolbay is always dirty after initialization. This will guarantee
  // that the model will have new tools bound on first invocation.
  private dirty = true;

  static async initToolbay(): Promise<ToolBay> {
    const toolboxes = [];
    // const x402fToolboxInstance = await initializeToolbox(x402fToolbox);
    // toolboxes.push(x402fToolboxInstance);
        const mcpToolbox = await McpToolbox.init(
      {
        fangornMcp: {
          transport: "http",
          url: "https://502f-173-235-179-233.ngrok-free.app/mcp"
        }
      },
      "mcp_toolbox"
    )
    const gmailToolbox = await initializeToolbox(GmailToolbox)
    toolboxes.push(gmailToolbox);
    toolboxes.push(mcpToolbox)

    return new ToolBay(toolboxes);
  }

  // Initially, there will only be toolboxes available as tool calls
  constructor(toolboxes: Toolbox[]) {
    toolboxes.forEach((tb) => {
      this.toolboxes.set(tb.name, tb);
      this.currentTools.set(tb.name, tb.getToolboxAsTool());
    });
  }

  async invokeToolcall(toolName: string, toolArgs: any[]): Promise<any> {
    const tool = this.currentTools.get(toolName);

    if (this.toolboxes.has(toolName)) {
      const toolbox = this.toolboxes.get(toolName);
      this.inject(toolbox!.getTools(), toolName);
    }

    console.log(`Executing tool: ${toolName}`);
    const result = await tool!.invoke(toolArgs);
    console.log(`Tool result: ${result}`);

    // If this is an MCP tool whose data should be rendered in the UI,
    // stash the parsed result so the server can forward it to the frontend.
    if (MCP_UI_TOOLS.has(toolName)) {
      try {
        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        console.log(`[ToolBay] Stashing MCP UI result for "${toolName}". Type: ${typeof result}. Parsed keys:`, typeof parsed === "object" ? Object.keys(parsed) : "not an object");
        this.mcpResults.push({ toolName, data: parsed });
      } catch {
        // If it doesn't parse, skip — the model still gets the string
        console.log(`[ToolBay] Could not parse MCP result for UI forwarding. Raw type: ${typeof result}, preview: ${String(result).slice(0, 200)}`);
      }
    }

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
    this.toolboxes.forEach((tb) =>
      this.currentTools.set(tb.name, tb.getToolboxAsTool()),
    );
    this.dirty = true;
  }

  /**
   * Returns and clears any accumulated MCP results that should
   * be forwarded to the frontend for rich UI rendering.
   */
  consumeMcpResults(): McpUiResult[] {
    const results = this.mcpResults;
    this.mcpResults = [];
    return results;
  }
}