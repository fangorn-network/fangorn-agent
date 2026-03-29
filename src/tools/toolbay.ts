import { DynamicStructuredTool } from "@langchain/core/tools";
// import { x402fToolbox } from "./toolboxes/x402fToolbox/x402fToolbox.js";
import { GmailToolbox } from "./toolboxes/gmailToolbox/GmailToolbox.js";
import { initializeToolbox, Toolbox } from "./types.js";
import { ToolCall } from "langchain";
import { DirectToolOutput } from "@langchain/core/messages";
import { Client } from "@modelcontextprotocol/sdk/client";
import z from "zod"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { GraphitiToolbox } from "./toolboxes/graphitiToolbox/graphitiMcp.js";

// Examples of a toolbox:
// Web3 toolbox: wallets, signing, funds, etc.
// Websearch toolbox: google queries, using other LLMs for queries
// Filesystem toolbox
// etc.
// Toolboxes are a collection of tools that are local to the agent.
export class ToolBay {
  private currentTools: Map<string, DynamicStructuredTool> = new Map();
  private toolboxes: Map<string, Toolbox> = new Map();
  private graphitiToolbox: any;

  // The toolbay is always dirty after initialization. This will guarantee
  // that the model will have new tools bound on first invocation.
  private dirty = true;

  static async initToolbay(): Promise<ToolBay> {
    const toolboxes = [];
    // const x402fToolboxInstance = await initializeToolbox(x402fToolbox);
    // toolboxes.push(x402fToolboxInstance);
    const gmailToolbox = await initializeToolbox(GmailToolbox)
    toolboxes.push(gmailToolbox);
    const graphitiToolbox = await initializeToolbox(GraphitiToolbox);
    // toolboxes.push(graphitiToolbx);
    const toolbay = new ToolBay(toolboxes, graphitiToolbox);
    return toolbay
  }

  // Initially, there will only be toolboxes available as tool calls
  constructor(toolboxes: Toolbox[], graphitiToolbox: any) {
    toolboxes.forEach((tb) => {
      this.toolboxes.set(tb.name, tb);
      this.currentTools.set(tb.name, tb.getToolboxAsTool());
    });

    this.graphitiToolbox = graphitiToolbox;

    graphitiToolbox.getTools().forEach((tool: any) => {
      this.currentTools.set(tool.name, tool)
    })
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
    )

    this.graphitiToolbox.getTools().forEach((tool: any) => {
      this.currentTools.set(tool.name, tool)
    })
    this.dirty = true;
  }
}
