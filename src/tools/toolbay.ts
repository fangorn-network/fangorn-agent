import { DynamicStructuredTool } from "@langchain/core/tools";
import { GmailToolbox } from "./toolboxes/gmailToolbox/GmailToolbox.js";
import { FileEntry, initializeToolbox, ManifestState, Schema, Toolbox } from "./types.js";
import { McpToolbox } from "./toolboxes/mcpToolbox/mcpToolbox.js";
import { ToolMessage } from "langchain";

// Examples of a toolbox:
// Web3 toolbox: wallets, signing, funds, etc.
// Websearch toolbox: google queries, using other LLMs for queries
// Filesystem toolbox
// etc.
// Toolboxes are a collection of tools that are local to the agent.
// Tool names whose raw results should be forwarded to the frontend

const SUBGRAPH_LIST_SCHEMAS = "subgraph_list_schemas"
const SUBGRAPH_QUERY_DATA = "subgraph_query_data"

const MCP_UI_TOOLS = new Set([
  SUBGRAPH_LIST_SCHEMAS,
  SUBGRAPH_QUERY_DATA
]);

export interface McpUiResult {
  toolName?: string;
  schemaData?: Schema[];
  manifestData?: ManifestState[]
  fileData?: FileEntry[];
  data?: any;
}

export class ToolBay {
  private currentTools: Map<string, DynamicStructuredTool> = new Map();
  private toolboxes: Map<string, Toolbox> = new Map();

  // Accumulated MCP results that should be forwarded to the frontend
  // private mcpResults: McpUiResult = {};
  private mcpData: McpUiResult = {};

  // The toolbay is always dirty after initialization. This will guarantee
  // that the model will have new tools bound on first invocation.
  private dirty = true;

  static async initToolbay(): Promise<ToolBay> {
    const toolboxes = [];

    const fangornMcpUrl = process.env.FANGORN_MCP_URL ?? "http://localhost:4000"
    const mcpToolbox = await McpToolbox.init(
      {
        fangornMcp: {
          transport: "http",
          url: fangornMcpUrl
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
    let result = await tool!.invoke(toolArgs);
    // console.log(`Tool result: ${result}`);

    // If this is an MCP tool whose data should be rendered in the UI,
    // stash the parsed result so the server can forward it to the frontend.
    if (MCP_UI_TOOLS.has(toolName)) {
      try {
        const parsed = JSON.parse(result)

        console.log(`resultType: ${JSON.stringify(parsed.resultType)}`)

        let schemaData: Schema[] = this.mcpData.schemaData ?? []
        let fileData: FileEntry[] = this.mcpData.fileData ?? []
        let manifestData: ManifestState[] = this.mcpData. manifestData ?? []
        let data: any = this.mcpData.data ?? {}
        if (parsed.resultType === "schemas") {
          schemaData = parsed.data
          console.log(`Schemas successfully retrieved. There were ${schemaData.length} schemas found.`)
          result = `Tell the user something along the lines of "${schemaData.length} schemas successfully retrieved". No further tool calls are required.`
        } else if (parsed.resultType === "manifest_states") {
          manifestData = parsed.data;
          console.log(`Data retrieved: ${manifestData.length} manifests found.`);
          console.log(`manifest data: ${JSON.stringify(manifestData, null, 2)}`)
          result = `Tell the user "${manifestData.length} manifests successfully retrieved". No further tool calls are required.`;
        } else if (parsed.resultType === "file_entries") {
          fileData = parsed.data;
          console.log(`Data retrieved: ${fileData.length} file entries found.`);
          result = `Tell the user "${fileData.length} file entries successfully retrieved". No further tool calls are required.`;
        } else {
          data = typeof result === "string" ? JSON.parse(result) : result;
          console.log(`[ToolBay] Stashing MCP UI result for "${toolName}". Type: ${typeof result}. Parsed keys:`, typeof data === "object" ? Object.keys(data) : "not an object");
          result = `Tell the user something along the lines of "Data successfully retrieved". No further tool calls are required.`
        }

        this.mcpData = { toolName, manifestData, schemaData, fileData, data};

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
  consumeMcpResults(): McpUiResult {
    return this.mcpData;
  }
}