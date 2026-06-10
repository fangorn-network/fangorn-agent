#!/bin/bash

# ─────────────────────────────────────────────
# Configuration — change these if needed
# ─────────────────────────────────────────────
LLM="ollama" # Options: ollama (locally running), anthropic
CONTAINER_NAME="ollama"
HOST_PORT=11434
CONTAINER_PORT=11434
MODEL="qwen3:8b"
# MODEL="qwen3.5:4b"
# MODEL="gemma4:e4b"
WAIT_TIMEOUT=30
AGENT_PORT=3001                              # port for the agent server
AGENT_WORKSPACE="${AGENT_WORKSPACE:-$PWD}"   # directory the coding agent works in
USE_WEB="true"

# ─────────────────────────────────────────────
# Start or restart Ollama (only if using ollama)
# ─────────────────────────────────────────────
if [ "$LLM" = "ollama" ]; then
  echo "🔍 Checking for Ollama on port ${HOST_PORT}..."

  if curl -s "http://localhost:${HOST_PORT}" > /dev/null 2>&1; then
    echo "✅ Ollama is already running."
  else
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
      STATUS=$(docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME")
      if [ "$STATUS" = "running" ]; then
        echo "✅ Container '$CONTAINER_NAME' is already running."
      else
        echo "▶️  Starting existing container '$CONTAINER_NAME'..."
        docker start "$CONTAINER_NAME"
      fi
    else
      echo "🚀 Creating and starting Ollama container..."
      docker run -d \
        --gpus=all \
        -v ollama:/root/.ollama \
        -p "${HOST_PORT}:${CONTAINER_PORT}" \
        --name "$CONTAINER_NAME" \
        ollama/ollama
    fi

    # ─────────────────────────────────────────────
    # Wait for Ollama API to be ready
    # ─────────────────────────────────────────────
    echo "⏳ Waiting for Ollama to be ready on port ${HOST_PORT}..."

    ELAPSED=0
    until curl -s "http://localhost:${HOST_PORT}" > /dev/null 2>&1; do
      if [ "$ELAPSED" -ge "$WAIT_TIMEOUT" ]; then
        echo "❌ Ollama did not become ready within ${WAIT_TIMEOUT} seconds. Exiting."
        exit 1
      fi
      sleep 1
      ELAPSED=$((ELAPSED + 1))
    done

    echo "✅ Ollama is ready."
  fi
else
  echo "☁️  Using Anthropic API — skipping Ollama setup."
fi

# ─────────────────────────────────────────────
# Build the Fangorn Agent
# ─────────────────────────────────────────────
echo "🔨 Building Fangorn Agent and Tools..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

pnpm build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Exiting."
  exit 1
fi

echo "✅ Build successful."

cd dev-server

# ─────────────────────────────────────────────
# Start the Agent Server
# ─────────────────────────────────────────────
echo "🤖 Starting agent server at http://localhost:${AGENT_PORT}..."
echo "📂 Workspace: ${AGENT_WORKSPACE}"

LLM="$LLM" OLLAMA_PORT="$HOST_PORT" MODEL="$MODEL" PORT="$AGENT_PORT" \
  AGENT_WORKSPACE="$AGENT_WORKSPACE" node build/server.js & AGENT_PID=$!

if [ "$USE_WEB" = "true" ]; then
	cd ../web-app

	echo "🖥️ Starting up UI at http://localhost:3000..."

	NEXT_PUBLIC_AGENT_URL="http://localhost:${AGENT_PORT}" pnpm dev & UI_PID=$!

else
	echo "Not running dedicated webapp"
fi

cleanup() {
  echo "🛑 Shutting down..."
  kill $AGENT_PID 2>/dev/null
  [ -n "$UI_PID" ] && kill $UI_PID 2>/dev/null
  wait
  exit 0
}

trap cleanup SIGINT SIGTERM

wait
