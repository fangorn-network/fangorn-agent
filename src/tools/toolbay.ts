import { DynamicStructuredTool } from "@langchain/core/tools";
import { GmailToolbox } from "./toolboxes/gmailToolbox/GmailToolbox.js";
import { initializeToolbox, Toolbox } from "./types.js";
import { McpToolbox } from "./toolboxes/mcpToolbox/mcpToolbox.js";
import { FangornToolbox } from "./toolboxes/fangornToolbox/fangornToolbox.js";
import type { FileEntry, FileField, Manifest, ManifestState, SchemaState } from "@fangorn-network/client-types";

// Examples of a toolbox:
// Web3 toolbox: wallets, signing, funds, etc.
// Websearch toolbox: google queries, using other LLMs for queries
// Filesystem toolbox
// etc.
// Toolboxes are a collection of tools that are local to the agent.
// Tool names whose raw results should be forwarded to the frontend

const SUBGRAPH_LIST_SCHEMAS = "subgraph_list_schemas";
const SUBGRAPH_GET_SCHEMA = "subgraph_get_schema";
const SUBGRAPH_GET_SCHEMA_ENTRIES = "subgraph_get_schema_entries";
const SUBGRAPH_LIST_MANIFEST_STATES = "subgraph_list_manifest_states";
const SUBGRAPH_LIST_MANIFESTS = "subgraph_list_manifests";
const SUBGRAPH_GET_MANIFEST = "subgraph_get_manifest";
const SUBGRAPH_LIST_FILE_ENTRIES = "subgraph_list_file_entries";
const SUBGRAPH_GET_FILE_ENTRIES = "subgraph_get_file_entries";
const SUBGRAPH_GET_FIELDS = "subgraph_get_fields";
const SUBGRAPH_SEARCH_FIELDS = "subgraph_search_fields";
const SUBGRAPH_SEARCH_FIELDS_GLOBAL = "subgraph_search_fields_global";
const SUBGRAPH_RAW_QUERY = "subgraph_raw_query";

const MCP_UI_TOOLS = new Set([
SUBGRAPH_LIST_SCHEMAS,
SUBGRAPH_GET_SCHEMA,
SUBGRAPH_GET_SCHEMA_ENTRIES,
SUBGRAPH_LIST_MANIFEST_STATES,
SUBGRAPH_LIST_MANIFESTS,
SUBGRAPH_GET_MANIFEST,
SUBGRAPH_LIST_FILE_ENTRIES,
SUBGRAPH_GET_FILE_ENTRIES,
SUBGRAPH_GET_FIELDS,
SUBGRAPH_SEARCH_FIELDS,
SUBGRAPH_SEARCH_FIELDS_GLOBAL,
SUBGRAPH_RAW_QUERY
]);

export interface McpUiResult {
  toolName?: string;
  resultType?: string;
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

  hasEntityContext: boolean = false;

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

    if (process.env.USE_GMAIL) {
        const gmailToolbox = await initializeToolbox(GmailToolbox)
        toolboxes.push(gmailToolbox);
    }

    const fangornToolbox = await initializeToolbox(FangornToolbox)

    toolboxes.push(mcpToolbox)
    toolboxes.push(fangornToolbox)

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
        const data: any = parsed.data
        const resultType: string = parsed.resultType

        if (resultType !== "non-standard") {
          const count = Array.isArray(data) ? data.length : 1;
          const summary = this.buildSummary(data, resultType);
         result = [
          `${count} ${resultType.replace(/_/g, " ")} retrieved successfully.`,
          `Summary: ${summary}`,
          `The full data is being displayed to the user in the UI. `,
          `You can use the summary above to form a response. `,
          `Do not include raw JSON in your response. `,
          this.hasEntityContext
            ? `If the user's question requires additional data, you may make further tool calls.`
            : `Do not make additional tool calls unless the user explicitly asks for different data. `
           ].join("\n");
        } else {
          console.log("It was non-standard")
          console.log("resultType")
          result = `${result} \n\nIt looks like you made a raw query. The user will not get to see the full data in the UI.`
        }

        this.mcpData = { toolName, data, resultType};

      } catch {
        // If it doesn't parse, skip — the model still gets the string
        console.log(`[ToolBay] Could not parse MCP result for UI forwarding. Raw type: ${typeof result}, preview: ${String(result).slice(0, 200)}`);
      }
    }

    return result;
  }
  private buildSummary(data: any, resultType: string): string {
  if (!Array.isArray(data)) return JSON.stringify(data).slice(0, 500);
  
  switch (resultType) {
    case "schemas":
      return data.map((s: SchemaState) => 
        `${s.name} (owner: ${s.owner}, ${s.versions?.length || 0} versions, fields: ${s.versions?.[s.versions.length-1]?.fields?.map((f: any) => f.name).join(", ") || "none"})`
      ).join("; ");
    
    case "manifest_states":
      return data.map((ms:  ManifestState) => 
        `${ms.schemaName} by ${ms.owner} (${ms.manifest?.files?.length || 0} files, v${ms.version})`
      ).join("; ");

		case "manifests":
			return data.map((m: Manifest, i: number) => 
        `manifest${i + 1}: (${m.files?.length || 0} files, v${m.manifestVersion})`
      ).join("; ");
    
    case "file_entries":
      return data.map((fe: FileEntry, i: number) => {
        const fields = fe.fileFields?.map((f: any) => `${f.name}=${f.acc === "plain" ? f.value : "[encrypted]"}`).join(", ");
        return `File ${i+1}: ${fields}`;
      }).join("; ");
    
    case "fields":
      return data.map((f: FileField) => 
        `${f.name}=${f.acc === "plain" ? f.value : "[encrypted]"} (${f.atType})`
      ).join("; ");
    
    default:
      return `${data.length} items`;
  }
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
    const data = this.mcpData
    this.mcpData = {}
    return data;
  }
}