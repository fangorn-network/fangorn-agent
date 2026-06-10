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
  Anthropic = "anthropic",
}

export type FangornToolboxConfig = Record<string, any>;

export interface AgenticConfig {
  llmProvider: LLMProvider;
  llmModel: string;
  apiKey?: string;
  url?: string;
  /** Context window size for Ollama models. Ollama's default (often 2048-4096) is too small for tool use. */
  numCtx?: number;
  /** Enable thinking/reasoning for Ollama models that support it. Off is faster and avoids empty final answers in tool loops. */
  think?: boolean;
}

export interface ToolboxEntry {
  id: string;
  enabled: boolean;
  fields: FangornToolboxConfig;
}

/**
 * Progress events emitted while the agent loop runs, so callers can
 * surface incremental updates (thoughts, tool activity) to the user.
 */
export type AgentProgressEvent =
  | { type: "thinking"; text: string }
  | { type: "assistant_text"; text: string }
  | { type: "tool_call"; name: string; args: Record<string, any> }
  | { type: "tool_result"; name: string; ok: boolean; preview: string };

export type AgentEventHandler = (event: AgentProgressEvent) => void;

export interface FangornAgentConfig {
  systemPrompt: string;
  useMemory: boolean;
  agenticConfig: AgenticConfig;
  toolboxDir: string;
  toolboxEntries: ToolboxEntry[];
  /** Token budget for short-term memory. Overrides the per-provider default. */
  memoryBudget?: number;
}

/**
 * Describes a field the UI should render for a given toolbox.
 */
export interface ToolboxFieldDescriptor {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "url-list" | "toggle";
  placeholder?: string;
  appProvided?: boolean;
}

/**
 * Metadata the UI needs to render a toolbox config card.
 * Discovered from each toolbox's config.json.
 */
export interface ToolboxDescriptor {
  id: string;
  label: string;
  description: string;
  fields: ToolboxFieldDescriptor[];
}
