#!/bin/bash

# ─────────────────────────────────────────────
# Configuration — change these if needed
# ─────────────────────────────────────────────
LLM="ollama" # Options: ollama (locally running), anthropic
CONTAINER_NAME="ollama"
HOST_PORT=11434
CONTAINER_PORT=11434
MODEL="qwen3.5:9b"
WAIT_TIMEOUT=30
WEB_PORT=3001           # port for the chat UI

# ─────────────────────────────────────────────
# Start or restart the Ollama container (only if using ollama)
# ─────────────────────────────────────────────
if [ "$LLM" = "ollama" ]; then
  echo "🔍 Checking for existing Ollama container..."

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
else
  echo "☁️  Using Anthropic API — skipping Ollama container setup."
fi

# ─────────────────────────────────────────────
# Build the Fangorn Agent
# ─────────────────────────────────────────────
echo "🔨 Building Fangorn Agent..."

npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Exiting."
  exit 1
fi

echo "✅ Build successful."

echo "🖥️ Starting up UI..."

cd web-app
npm run dev & UI_PID=$!

cleanup() {
  echo "🛑 Shutting down..."
  kill $UI_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

cd ../

# ─────────────────────────────────────────────
# Start the Web Server
# ─────────────────────────────────────────────
echo "🌐 Starting web chat server at http://localhost:${WEB_PORT}..."

LLM="$LLM" OLLAMA_PORT="$HOST_PORT" MODEL="$MODEL" PORT="$WEB_PORT" node build/server.js