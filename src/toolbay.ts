import { DynamicStructuredTool } from "@langchain/core/tools";

export type ToolBox = {
    name: string;
    description: string;
    tools: Record<string, DynamicStructuredTool>;
    // <name, description>
    toolData: Record<string, string>
}

// A toolbay is what holds all of an agent's(MCP?'s) tools.
// It is responsible for serving sensible names and descriptions
// for what a toolbox does. It is also going to be responsible
// for swapping out toolboxes/tracking active tools.
// Thought for late: try to make sure that an agent can't have
// more than one copy of a toolbox at a time

// Examples of a toolbox:
// Web3 toolbox: wallets, signing, funds, etc.
// Websearch toolbox: google queries, using other LLMs for queries
// Filesystem toolbox
// etc.
// Toolboxes are a collection of tools that are local to the agent.
// is a toolbox just a tool in itself?
export class ToolBay {

    private tools: Map<string, DynamicStructuredTool> = new Map()
    private dirty = false;
    constructor() {}

    inject(newTools: DynamicStructuredTool[], toolToRemove?: string) {
        newTools.forEach(t => this.tools.set(t.name, t));

        if (toolToRemove) {
            console.log(JSON.stringify(this.tools))
            this.tools.delete(toolToRemove);
        }
        this.dirty = true;
    }

    getAll() {
        // console.log("returning these tools: ")
        // console.log(this.tools.values())
        return Array.from(this.tools.values())
    }

    consumeDirty() {
        this.dirty = false;
        return this.getAll();
    }

    isDirty() {
        return this.dirty;
    }

    resetToolBay(toolBoxes: DynamicStructuredTool[]) {
        console.log("console.log - reset toolbay")
        this.tools.clear()
        this.inject(toolBoxes)
    }
}