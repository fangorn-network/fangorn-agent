import { DynamicStructuredTool } from "@langchain/core/tools";
import { AgentsToolbox } from "./toolboxes/x402fToolBox.js"
import { initializeToolbox, Toolbox } from "./types.js";

// Examples of a toolbox:
// Web3 toolbox: wallets, signing, funds, etc.
// Websearch toolbox: google queries, using other LLMs for queries
// Filesystem toolbox
// etc.
// Toolboxes are a collection of tools that are local to the agent.
export class ToolBay {

    private tools: Map<string, DynamicStructuredTool> = new Map()
    private toolboxes: Map<string, Toolbox> = new Map()

    // The toolbay is always dirty after initialization. This will guarantee
    // that the model will have new tools bound on first invocation.
    private dirty = true;

    static async initToolbay(): Promise<ToolBay> {

        const toolboxes = []
        const x402fToolboxInstance = await initializeToolbox(AgentsToolbox);

        toolboxes.push(x402fToolboxInstance)

        return new ToolBay(toolboxes);

    }

    // Initially, there will only be toolboxes available as tool calls
    constructor(toolboxes: Toolbox[]) {
        toolboxes.forEach(tb => {
            this.toolboxes.set(tb.name, tb);
            this.tools.set(tb.name, tb.getToolboxTool());
        })
    }

    async invokeToolcall(toolName: string, toolArgs: any[]): Promise<any> {

        const tool = this.tools.get(toolName);

        if(this.toolboxes.has(toolName)) {
            const toolbox = this.toolboxes.get(toolName);
            this.inject(toolbox!.getTools(), toolName)
        }

        console.log(`Executing tool: ${toolName}`);
        const result = await tool!.invoke(toolArgs);
        console.log(`Tool result: ${result}`);

        return result
    }

    inject(newTools: DynamicStructuredTool[], toolToRemove?: string) {
        newTools.forEach(t => this.tools.set(t.name, t));

        if (toolToRemove) {
            console.log("removing toolbox from avaialable tools")
            this.tools.delete(toolToRemove);
        }
        this.dirty = true;
    }

    containsTool(toolName: string) {
        return this.tools.has(toolName);
    }

    consumeDirty() {
        this.dirty = false;
        return Array.from(this.tools.values())
    }

    isDirty() {
        return this.dirty;
    }

    resetToolBay() {
        console.log("console.log - reset toolbay")
        this.tools.clear()
        this.toolboxes.forEach(tb => this.tools.set(tb.name, tb.getToolboxTool()))
        this.dirty = true;
    }
}