import { DynamicStructuredTool } from "@langchain/core/tools";

export interface Toolbox {
    name: string
    getTools(): DynamicStructuredTool[];
    getToolboxTool(): DynamicStructuredTool;
}

export interface AsyncFactory<T> {
    init(): Promise<T>;
}

export async function initializeToolbox(factory: AsyncFactory<Toolbox>): Promise<Toolbox> {
    return factory.init();
}