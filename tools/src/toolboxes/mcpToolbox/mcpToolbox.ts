import { DynamicStructuredTool, tool } from "langchain";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import type { Connection } from "@langchain/mcp-adapters";
import { z } from "zod";
import { DataContext, Toolbox } from "../../types.js";
import { getToolsByName } from "../utils.js";

// Re-export the library's Connection type for convenience
export type McpTransportConfig = Connection;

// ── MCP Toolbox ────────────────────────────────────────────────────────────

/**
 * McpToolbox adapts one or more MCP servers into the Fangorn Toolbox
 * system using LangChain's `@langchain/mcp-adapters`.
 */
export class McpToolbox implements Toolbox {
  public name: string;
  private mcpClient: MultiServerMCPClient;
  private langchainTools: DynamicStructuredTool[];
  private toolNames: string[];
  private toolsWithExclude: Map<string, string>;

  dataContextProvider: (() => DataContext) | null = null;

  // ── Factory (AsyncFactory<Toolbox>) ────────────────────────────────────

  /**
   * Create an McpToolbox connected to the MCP server(s) described by
   * `servers`.
   *
   * @param servers       A map of server names to their transport configs.
   *                      Follows the same shape that `MultiServerMCPClient`
   *                      expects, keyed by a human-readable server name.
   * @param toolboxName   Name used in the ToolBay (defaults to "mcp_toolbox").
   */
  static async init(
    servers: Record<string, McpTransportConfig>,
    toolboxName: string = "mcp_toolbox",
  ): Promise<McpToolbox> {
    const client = new MultiServerMCPClient({
      mcpServers: servers,
      prefixToolNameWithServerName: false,
      additionalToolNamePrefix: "",
    });
    const tools = await client.getTools();
    let sanitizedTools: DynamicStructuredTool[] = [];
    let toolNames: string[] = [];
    let toolsWithExclude: Map<string, string> = new Map();
    if (tools && tools.length > 0) {
      const toolsWithExclude: Map<string, string> = new Map();
      const toolNames: string[] = [];
      // Here, we intercept the returned tools to
      // see if there are input fields the agent shouldn't
      // know about or that we don't want it to mess up.
      sanitizedTools = tools.map((t) => {
        // console.log(`schema: \n ${JSON.stringify(t.schema)}`)
        const schema = t.schema;

        if (
          typeof schema === "object" &&
          schema !== null &&
          "properties" in schema
        ) {
          let properties = schema.properties;
          if ("excludeIds" in properties) {
            const { excludeIds, ...otherProps } = properties;
            schema.properties = otherProps;
            console.log("New Properties:");
            console.log(schema.properties);
            t.schema = schema;
            // In the future, "excludeIds" should be the name of the field that is excluded
            toolsWithExclude.set(t.name, "excludeIds");
          }
        }
        toolNames.push(t.name);
        return t;
      });
    }

    return new McpToolbox(
      toolboxName,
      client,
      sanitizedTools,
      toolNames,
      toolsWithExclude,
    );
  }

  // ── Constructor ────────────────────────────────────────────────────────

  private constructor(
    name: string,
    mcpClient: MultiServerMCPClient,
    langchainTools: DynamicStructuredTool[],
    toolNames: string[],
    toolsWithExclude: Map<string, string>,
  ) {
    this.name = name;
    this.mcpClient = mcpClient;
    this.langchainTools = langchainTools;
    this.toolNames = toolNames;
    this.toolsWithExclude = toolsWithExclude;
  }

  // ── Toolbox interface ──────────────────────────────────────────────────

  getTools(): DynamicStructuredTool[] {
    return this.langchainTools;
  }

  getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool> {
    const matchingToolMap = getToolsByName(this.getTools(), toolNames);
    return matchingToolMap;
  }

  getToolboxAsTool(): DynamicStructuredTool {
    const toolList = this.toolNames.join(", ");
    return tool(
      async () => {
        console.log(`[McpToolbox] agent activated "${this.name}" toolbox`);
        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            `MCP tools are now available. You now have access to: ${toolList}. ` +
            `Re-plan and use them to complete the task.`,
        });
      },
      {
        name: this.name,
        description:
          `Activate MCP tools: ${toolList}. ` +
          `Use this tool first before attempting to use any of the contained tools.`,
        schema: z.object({}),
      },
    );
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  /** Gracefully close all MCP connections. */
  async close(): Promise<void> {
    await this.mcpClient.close();
  }
}
