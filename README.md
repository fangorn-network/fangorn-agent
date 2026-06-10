# Fangorn Agent

A local coding agent built on the Fangorn agent harness, powered by Ollama.

## Workspace:

1. agent - The core agent loop (FangornAgent) and short-term memory
2. agent-types - Shared types for the agent, tools, and servers
3. tools - The tools, toolboxes, and toolbay used by the Fangorn Agent, including the coding toolbox (read/write/edit/search files, run shell commands)
4. dev-server - Express server that hosts the agent and exposes chat, tool, and model endpoints
5. web-app - The chat UI for the coding agent

## Quick start

```bash
# Work on the current directory
./run.sh

# Or point the agent at a specific project
AGENT_WORKSPACE=/path/to/project ./run.sh
```

This starts (or reuses) Ollama, builds the workspace, runs the agent server on
http://localhost:3001, and serves the chat UI at http://localhost:3000.

The model defaults to `qwen3:8b` (edit `MODEL` in `run.sh`), and can be switched
at runtime from the model dropdown in the UI — any model from `ollama list` is
available.

## Configuration

The agent server reads `dev-server/.env` (see `dev-server/env.example`):

- `LLM` — `ollama` or `anthropic`
- `MODEL` — model name (e.g. `qwen3:8b`)
- `AGENT_WORKSPACE` — directory the agent is allowed to read, edit, and run commands in
- `NUM_CTX` — Ollama context window (default 16384)
- `USE_MEMORY` / `MEMORY_BUDGET` — short-term memory across chat turns
- `SYSTEM_PROMPT` — override the built-in coding system prompt
