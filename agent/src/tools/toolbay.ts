import { DynamicStructuredTool } from "@langchain/core/tools";
import { GmailToolbox } from "./toolboxes/gmailToolbox/GmailToolbox.js";
import { DataContext, initializeToolbox, Toolbox } from "./types.js";
import { McpToolbox } from "./toolboxes/mcpToolbox/mcpToolbox.js";
import { FangornToolbox } from "./toolboxes/fangornToolbox/fangornToolbox.js";
import type { FileEntry, ManifestState, SchemaState } from "@fangorn-network/client-types";
import { fangornAgentConfig } from "../config.js";
import { buildFangornMusicPromptResponse, buildFullAgenticPromptResponse } from "../prompts.js";

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
	private toolboxes: (Toolbox | McpToolbox)[]

  // Accumulated MCP results that should be forwarded to the frontend
  private mcpData: McpUiResult = {};

  // The toolbay is always dirty after initialization. This will guarantee
  // that the model will have new tools bound on first invocation.
  private dirty = true;

	dataContextProvider: (() => DataContext) | null = null;

  static async initToolbay(dataContextProvider: () => DataContext): Promise<ToolBay> {
    const toolboxes = [];

		if (fangornAgentConfig.useMcp) {
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
    	toolboxes.push(mcpToolbox)
		}

    if (fangornAgentConfig.useGmail) {
      const gmailToolbox = await initializeToolbox(GmailToolbox)
      toolboxes.push(gmailToolbox);
    } 

    const fangornToolbox = await initializeToolbox(FangornToolbox)
		const fangornToolboxImpl = fangornToolbox as FangornToolbox
		fangornToolboxImpl.setDataContextProvider(dataContextProvider)

    toolboxes.push(fangornToolbox)

    return new ToolBay(toolboxes, dataContextProvider);
  }

  constructor(toolboxes: (Toolbox | McpToolbox)[], dataContextProvider: () => DataContext) {
		this.toolboxes = toolboxes
		console.log("Setting dataContextProvider")
		console.log(dataContextProvider())
		this.dataContextProvider = dataContextProvider
  }

	async activateTools(toolNames: string[]) {
		this.dirty = true
		let activeTools = this.toolboxes.map((tb) => tb.getToolsByName(toolNames))
		this.currentTools = new Map(activeTools.flatMap(m => [...m]))
		console.log("activeTools:", activeTools.map(m => [...m.keys()]));
		console.log("currentTools:", [...this.currentTools.keys()]);
	}

	private getExcludedIds(): string[] {
    if (!this.dataContextProvider) {
			console.error("No data provider has been set")
      throw new Error("No data provider set");
    }
		const dataContext = this.dataContextProvider()
    return dataContext.excludeIds ?? [""];
  }


  async invokeToolcall(toolName: string, toolArgs: any): Promise<any> {

		console.log("Hi there")
		if (!this.currentTools.has(toolName)) {
			console.error("Tool called that doesn't exist.")
			throw new Error(`Tool with name ${toolName} doesn't exist.`)
		}

    const tool = this.currentTools.get(toolName);

		const excludeIds = this.getExcludedIds();

		if(excludeIds.length > 0) {
			console.log("TODO: There were IDS to be excluded. Implement adding tools to tool args.")
			// Example of toolArgs:
			// {"fieldName":"genre","fieldValue":"Jazz","caseSensitive":false,"first":9}
			// this so if we wanted to exclude file ids we would do something like
			// toolArgs["exludeIds"] = excludeIds
		}

    console.log(`Executing tool: ${toolName}`);
    let result = await tool!.invoke(toolArgs);
		const parsed = JSON.parse(result)
		let displayData = parsed.displayData

    // If this is an MCP tool whose data should be rendered in the UI,
    // stash the parsed result so the server can forward it to the frontend.
    if (displayData) {
      try {
        
        const data: any = parsed.data
        const resultType: string = parsed.resultType

        if (resultType !== "non-standard") {
          const count = Array.isArray(data) ? data.length : 1;
          const summary = this.buildSummary(data, resultType);
         	result = buildFangornMusicPromptResponse(count, resultType, summary)
					console.log(`result summary given to agent: ${JSON.stringify(result, null, 2)}`)
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

		console.log("Tool call was executed. Here are the results:")
		console.log(JSON.stringify(result, null, 2))

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

	// Old Impl where agent activated tools that we may need in the future
  // inject(newTools: DynamicStructuredTool[], toolToRemove?: string) {
  //   newTools.forEach((t) => this.currentTools.set(t.name, t));

  //   if (toolToRemove) {
  //     console.log("removing toolbox from avaialable tools");
  //     this.currentTools.delete(toolToRemove);
  //   }
  //   this.dirty = true;
  // }

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