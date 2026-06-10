# Fangorn Code — Web App

The chat UI for the Fangorn coding agent. Talks to the dev-server
(`http://localhost:3001` by default, override with `NEXT_PUBLIC_AGENT_URL`).

Features:

- Chat with the coding agent (markdown + code block rendering)
- Live activity stream — watch the agent's thoughts and tool calls as it works
- Ollama model picker — switch models without restarting
- Tool selector — scope which coding tools the agent may use
- Scoped vs. full-agentic chat modes

## Run

Usually started via `../run.sh` (when `USE_WEB=true`), or standalone:

```bash
pnpm dev
```

Requires the dev-server to be running.
