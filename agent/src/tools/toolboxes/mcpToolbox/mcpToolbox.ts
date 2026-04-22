import { DynamicStructuredTool, tool } from "langchain";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import type { Connection } from "@langchain/mcp-adapters";
import { z } from "zod";
import { Toolbox } from "../../types.js";

// Re-export the library's Connection type for convenience
export type McpTransportConfig = Connection;

// ── MCP Toolbox ────────────────────────────────────────────────────────────

/**
 * McpToolbox adapts one or more MCP servers into the Fangorn Toolbox
 * system using LangChain's `@langchain/mcp-adapters`.
 *
 * `MultiServerMCPClient.getTools()` returns LangChain-native
 * `StructuredTool` instances directly, so there is no need for manual
 * JSON Schema → Zod conversion or raw MCP SDK plumbing.
 *
 * Because it implements the `Toolbox` interface it plugs straight into the
 * ToolBay's hot-swap mechanism — the agent sees a single toolbox tool,
 * and only when it calls that tool do the individual MCP tools get injected.
 */
export class McpToolbox implements Toolbox {
  public name: string;
  private mcpClient: MultiServerMCPClient;
  private langchainTools: DynamicStructuredTool[] = [];
  private toolNames: string[] = [];

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
    const toolNames = tools.map((t) => t.name);

    return new McpToolbox(
      toolboxName,
      client,
      tools as DynamicStructuredTool[],
      toolNames,
    );
  }

  // ── Constructor ────────────────────────────────────────────────────────

  private constructor(
    name: string,
    mcpClient: MultiServerMCPClient,
    langchainTools: DynamicStructuredTool[],
    toolNames: string[],
  ) {
    this.name = name;
    this.mcpClient = mcpClient;
    this.langchainTools = langchainTools;
    this.toolNames = toolNames;
  }

  // ── Toolbox interface ──────────────────────────────────────────────────

  getTools(): DynamicStructuredTool[] {
    return this.langchainTools;
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
          `Access MCP tools: ${toolList}. ` +
          `Call this first before attempting to use any of these tools.`,
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