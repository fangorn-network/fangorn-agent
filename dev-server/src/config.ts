import dotenv from "dotenv";
import {
  AgenticConfig,
  FangornAgentConfig,
  LLMProvider,
  ToolboxEntry,
} from "@fangorn-network/agent-types";
import { createRequire } from "module";
import { dirname, join, resolve } from "path";

dotenv.config();

// ─── LLM ────────────────────────────────────────────────────
const llmProvider = (process.env.LLM as LLMProvider) ?? LLMProvider.Ollama;
const llmModel = process.env.MODEL ?? "qwen3:8b";

const ollamaPort = process.env.OLLAMA_PORT ?? "11434";
export const ollamaUrl =
  process.env.OLLAMA_URL ?? `http://localhost:${ollamaPort}`;

// Ollama defaults to a small context window; coding with tools needs more.
const numCtx = process.env.NUM_CTX ? Number(process.env.NUM_CTX) : 16384;

// Leave thinking up to the model unless explicitly set: qwen3 needs its
// default thinking to plan tool use (it narrates instead of acting without
// it), while sending an explicit think flag can error on models without
// thinking support.
const think = process.env.THINK ? process.env.THINK === "true" : undefined;

export const agenticConfig: AgenticConfig = {
  llmProvider,
  llmModel,
  url: llmProvider === LLMProvider.Ollama ? ollamaUrl : undefined,
  apiKey: process.env.ANTHROPIC_API_KEY,
  numCtx,
  think,
};

// ─── Workspace ──────────────────────────────────────────────
// The directory the coding agent is allowed to work in.
export const workspaceRoot = resolve(
  process.env.AGENT_WORKSPACE ?? process.cwd(),
);

// ─── Memory ─────────────────────────────────────────────────
export const useMemory = process.env.USE_MEMORY
  ? process.env.USE_MEMORY === "true"
  : true;

const memoryBudget = process.env.MEMORY_BUDGET
  ? Number(process.env.MEMORY_BUDGET)
  : 8192;

// ─── Toolboxes ──────────────────────────────────────────────
// Resolve the built toolboxes directory inside the agent-tools package.
const require = createRequire(import.meta.url);
const toolboxDir = join(
  dirname(require.resolve("@fangorn-network/agent-tools")),
  "toolboxes",
);

const toolboxEntries: ToolboxEntry[] = [
  {
    id: "codingToolbox",
    enabled: true,
    fields: { workspaceRoot },
  },
];

// ─── System prompt ──────────────────────────────────────────
const systemPrompt =
  process.env.SYSTEM_PROMPT ??
  `You are a coding assistant working in the workspace at ${workspaceRoot}.

You have tools to read, list, find, search, write, and edit files, and to run shell commands. All file paths are relative to the workspace root.

Rules:
- Act, do not narrate: never reply with what you are going to do. If you need information, call a tool now and only reply with text once you have the answer.
- Explore before you act: read a file before editing it, and search before guessing where code lives.
- Prefer edit_file for small changes; use write_file only for new files or full rewrites.
- After changing code, verify it when possible (run the build or tests with run_command).
- Keep responses short and concrete. Put code in markdown code blocks.
- If a request is ambiguous or destructive, ask the user before acting.`;

// In full-agentic mode the agent starts with only toolbox-activation tools,
// so the prompt must explain the unlock step instead of naming file tools.
export const fullAgenticSystemPrompt =
  process.env.AGENTIC_SYSTEM_PROMPT ??
  `You are a coding assistant working in the workspace at ${workspaceRoot}.

Your tools are grouped into toolboxes. First call a toolbox tool (such as activate_coding_tools) to unlock its tools, then use the unlocked tools to complete the task. All file paths are relative to the workspace root.

Rules:
- Act, do not narrate: never reply with what you are going to do. Call the tools instead, and only reply with text once you have the answer.
- Always activate a toolbox and use its tools instead of answering from memory.
- Explore before you act: read a file before editing it.
- After changing code, verify it when possible (run the build or tests).
- Keep responses short and concrete. Put code in markdown code blocks.`;

export const fangornAgentConfig: FangornAgentConfig = {
  systemPrompt,
  useMemory,
  agenticConfig,
  toolboxDir,
  toolboxEntries,
  memoryBudget,
};

console.log(`LLM provider: ${llmProvider}, model: ${llmModel}`);
if (llmProvider === LLMProvider.Ollama) {
  console.log(`Ollama URL: ${ollamaUrl}, numCtx: ${numCtx}`);
}
console.log(`Workspace root: ${workspaceRoot}`);
console.log(
  `Short term memory: ${useMemory ? `enabled (budget ${memoryBudget} tokens)` : "disabled"}`,
);
