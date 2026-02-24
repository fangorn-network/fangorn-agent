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
export class ToolBay {

    // Maybe we should summarize what tools it has acces to. Something like:
    // You have access to these toolboxes? IDK if that's helpful.
    private toolbayDescription: string;
    private toolBoxCollection: Record<string, ToolBox>;

    public constructor(toolBoxCollection: Record<string, ToolBox>) {

        this.toolBoxCollection = toolBoxCollection;

        

    }

    public createToolbox(name: string, description: string, toolList: DynamicStructuredTool[]) {

        let tools: Record<string, DynamicStructuredTool> = {}
        let toolData: Record<string, string> = {}

        for (const tool of toolList) {
            tools[tool.name] = tool;
            toolData[tool.name] = tool.description;
        }

        const toolbox: ToolBox = {name, description, tools, toolData}

        return toolbox

    }

    public getToolbayDescription() {

        let toolboxDescriptions = []

        for (const [toolboxName, toolbox] of Object.entries(this.toolBoxCollection)) {


            

            toolboxDescriptions.push({name: toolboxName, description: toolbox.description})



        }

    }

}