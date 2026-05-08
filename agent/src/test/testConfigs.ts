import { AgenticConfig, FangornAgentConfig, LLMProvider, ToolboxEntry } from "@fangorn-network/agent-types";

const agenticConfig: AgenticConfig = {
  llmModel: "qwen3.5:8b",
  llmProvider: LLMProvider.Ollama
}

const toolboxDir = ""
const toolboxEntries: ToolboxEntry[] = []

export const fangornAgentConfig: FangornAgentConfig = {
  useMemory: false,
  systemPrompt: "You are an AI agent.",
  agenticConfig,
  toolboxDir,
  toolboxEntries
}
