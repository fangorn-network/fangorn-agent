import { DynamicStructuredTool, tool } from "langchain";
import { Toolbox } from "../../types.js";
import { z } from "zod";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export class GraphitiToolbox implements Toolbox {
  public name = "graphiti_toolbox";

  private graphitiMcpClient: Client;
  
  private toolNames: string[];
  private tools: DynamicStructuredTool[];
  static async init(): Promise<GraphitiToolbox> {

  const graphitiUrl = process.env.GRAPHITI_MCP_URL || "http://localhost:8000/mcp";
  const client = new Client({ name: `Graphiti-Client`, version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(graphitiUrl));
  const graphitiMcpClient = await client.connect(transport);

  const { tools: mcpTools } = await client.listTools();

  console.log("Tools: ", mcpTools);

    const langchainTools = mcpTools.map((mcpTool) => {
      return new DynamicStructuredTool({
        name: mcpTool.name,
        description: mcpTool.description || "",
        schema: z.object({}).loose(),
        func: async (args) => {
          const result: any = await client.callTool({
            name: mcpTool.name,
            arguments: args,
          });
          // result.content is an array of content blocks
          return result.content
            .map((block: any) => (block.type === "text" ? block.text : JSON.stringify(block)))
            .join("\n");
        },
      });
    });
    return new GraphitiToolbox(graphitiMcpClient, langchainTools);
  }

  constructor(client: any, tools: DynamicStructuredTool[]) {
    this.graphitiMcpClient = client;
    this.tools = tools
    this.toolNames = tools.map(tool => tool.name)
  }

  getTools(): DynamicStructuredTool[] {
    return this.tools;
  }

  public getToolboxAsTool(): DynamicStructuredTool {
    const graphitiToolbox = tool(
      async () => {
        console.log("console.log - agent called graphitiMcpToolbox tool");

        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            `Graphiti Tools are now avaialable. You now have access to ${this.toolNames.join(", ")}`,
        });
      },
      {
        name: this.name,
        description:
          "Access your long term memory via a Real-Time Knowledge Graph. Use these tools any time you think you need to retrieve a memory or remember something",
        schema: z.object({}),
      },
    );
    return graphitiToolbox;
  }
}
