import { DynamicStructuredTool } from "@langchain/core/tools";
import { GmailToolbox } from "./toolboxes/gmailToolbox/GmailToolbox.js";
import { initializeToolbox, Toolbox } from "./types.js";
import { McpToolbox } from "./toolboxes/mcpToolbox/mcpToolbox.js";
import { FangornToolbox } from "./toolboxes/fangornToolbox/fangornToolbox.js";
import type { FileEntry, ManifestState, SchemaState } from "@fangorn-network/client-types";

// Examples of a toolbox:
// Web3 toolbox: wallets, signing, funds, etc.
// Websearch toolbox: google queries, using other LLMs for queries
// Filesystem toolbox
// etc.
// Toolboxes are a collection of tools that are local to the agent.
// Tool names whose raw results should be forwarded to the frontend

const SUBGRAPH_LIST_SCHEMAS = "subgraph_list_all_schemas";
const SUBGRAPH_GET_SCHEMA_BY_NAME = "subgraph_get_schema_by_name";
const SUBGRAPH_LIST_MANIFEST_STATES_BY_SCHEMA_NAME = "subgraph_list_manifest_states_by_schema_name";
const SUBGRAPH_GET_MANIFEST_BY_ID = "subgraph_get_manifest_by_id";
const SUBGRAPH_LIST_FILE_ENTRIES = "subgraph_list_file_entries";
const SUBGRAPH_SEARCH_FIELDS = "subgraph_search_fields";
const SUBGRAPH_SEARCH_FIELDS_GLOBAL = "subgraph_search_fields_global";
const SUBGRAPH_RAW_QUERY = "subgraph_raw_query";
const SUBGRAPH_SEARCH_FIELDS_BY_NAME_GLOBAL = "subgraph_search_fields_by_name_global";
const SUBGRAPH_GET_SCHEMA_BY_ID = "subgraph_get_schema_by_id";
const SUBGRAPH_GET_FILE_BY_ID = "subgraph_get_file_by_id";

const MCP_UI_TOOLS = new Set([
SUBGRAPH_LIST_SCHEMAS,
SUBGRAPH_GET_SCHEMA_BY_NAME,
SUBGRAPH_LIST_MANIFEST_STATES_BY_SCHEMA_NAME,
SUBGRAPH_GET_MANIFEST_BY_ID,
SUBGRAPH_LIST_FILE_ENTRIES,
SUBGRAPH_SEARCH_FIELDS,
SUBGRAPH_SEARCH_FIELDS_GLOBAL,
SUBGRAPH_RAW_QUERY,
SUBGRAPH_SEARCH_FIELDS_BY_NAME_GLOBAL,
SUBGRAPH_GET_SCHEMA_BY_ID,
SUBGRAPH_GET_FILE_BY_ID
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
  private mcpData: McpUiResult = {};

  // The toolbay is always dirty after initialization. This will guarantee
  // that the model will have new tools bound on first invocation.
  private dirty = true;

  hasEntityContext: boolean = false;

  static async initToolbay(dataContextProvider: () => any): Promise<ToolBay> {
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
		const fangornToolboxImpl = fangornToolbox as FangornToolbox
		fangornToolboxImpl.setDataContextProvider(dataContextProvider)

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
  					`Use the summary above to form a natural language response.`,
  					`Always describe results in plain sentences or bullet points, never as raw JSON or code blocks.`,
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
		case "schemas": {
		  console.log("got schema states")
		  const owners = [...new Set(data.map((s: SchemaState) => s.owner))];
		  const schemaFields = data
		    .filter((s: SchemaState) => (s.versions?.length ?? 0) > 0)
		    .map((s: SchemaState) => {
		      const fieldNames = [...new Set(
		        s.versions?.[s.versions.length - 1]?.fields?.map((f: any) => f.name) ?? []
		      )];
		      return `${s.name} [${fieldNames.join(", ")}]`;
		    });
		  return `Owners: ${owners.join(", ")}; Schemas: ${schemaFields.join("; ")}`;
		}
		case "manifest_states": {
		  const owners = [...new Set(data.map((ms: ManifestState) => ms.owner))];
		  const manifests = data.map((ms: ManifestState) => {
		    const fields = [...new Set(
		      ms.manifest?.files?.flatMap((fe: FileEntry) =>
		        fe.fileFields?.map((f: any) => f.name) ?? []
		      ) ?? []
		    )];
		    const values = [...new Set(
		      ms.manifest?.files?.flatMap((fe: FileEntry) =>
		        fe.fileFields?.map((f: any) => f.acc === "plain" ? f.value : "[encrypted]") ?? []
		      ) ?? []
		    )];
		    return `${ms.schemaName} v${ms.version} [fields: ${fields.join(", ")}] [values: ${values.join(", ")}]`;
		  });
		  return `Owners: ${owners.join(", ")}; Manifests: ${manifests.join("; ")}`;
		}
    case "file_entries": {
			console.log("got Files")
  		const fieldNames = [...new Set(
  		  data.flatMap((fe: FileEntry) =>
  		    fe.fileFields?.map((f: any) => f.name) ?? []
  		  )
  		)];
  		const fieldValues = [...new Set(
  		  data.flatMap((fe: FileEntry) =>
  		    fe.fileFields?.map((f: any) => f.acc === "plain" ? f.value : "[encrypted]") ?? []
  		  )
  		)];
  		return `Field names: ${fieldNames.join(", ")}; Field values: ${fieldValues.join(", ")}`;
    }
    default:
			console.log(`Result type was: ${resultType}`)
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