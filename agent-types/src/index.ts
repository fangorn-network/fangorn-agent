import { DynamicStructuredTool } from "@langchain/core/tools";

export interface Toolbox {
  name: string;
  getTools(): DynamicStructuredTool[];
  getToolboxAsTool(): DynamicStructuredTool;
  getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool>;
}

export interface AsyncFactory<T> {
  init(config?: FangornToolboxConfig): Promise<T>;
}

export interface ToolboxPlugin {
  init(
    config: FangornToolboxConfig,
    dataContextProvider?: () => DataContext,
  ): Promise<Toolbox>;
}
 
export async function initializeToolbox(
  factory: AsyncFactory<Toolbox>,
  config?: FangornToolboxConfig,
): Promise<Toolbox> {
  return factory.init(config);
}

export interface DataContext {
  excludeIds?: string[];
}

export interface McpUiResult {
  toolName?: string;
  resultType?: string;
  data?: any;
}

export enum LLMProvider {
  Ollama = "ollama",
  Anthropic = "anthropic"
}

export type FangornToolboxConfig = Record<string, any>

export interface AgenticConfig {
  llmProvider: LLMProvider
  llmModel: string
  apiKey?: string
  url?: string
}

export interface ToolboxEntry {
  id: string;
  enabled: boolean;
  fields: FangornToolboxConfig;
}

export interface FangornAgentConfig {
    useMemory: boolean
    agenticConfig: AgenticConfig
    toolboxDir: string
    toolboxEntries: ToolboxEntry[]
}