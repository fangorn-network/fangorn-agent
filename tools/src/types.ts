import { DynamicStructuredTool } from "@langchain/core/tools";

export interface Toolbox {
  name: string;
  getTools(): DynamicStructuredTool[];
  getToolboxAsTool(): DynamicStructuredTool;
	getToolsByName(toolNames: string[]): Map<String,DynamicStructuredTool>;
}

export interface AsyncFactory<T> {
  init(): Promise<T>;
}

export async function initializeToolbox(
  factory: AsyncFactory<Toolbox>,
): Promise<Toolbox> {
  return factory.init();
}

export interface DataContext {
	excludeIds?: string[]
}
