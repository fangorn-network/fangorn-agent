#!/bin/bash

# ─────────────────────────────────────────────
# Configuration — change these if needed
# ─────────────────────────────────────────────
OLLAMA_CONTAINER_NAME="ollama"
OLLAMA_HOST_PORT=11434
OLLAMA_CONTAINER_PORT=11434
MODEL="qwen3.5:9b"          # model to ensure is available. qwen3.5:9b and qwen3.5:4b have both been tested.

QDRANT_CONTAINER_NAME="qdrant"
QDRANT_HOST_PORT=6333
QDRANT_CONTAINER_PORT=6333
QDRANT_CONTAINER_NAME="qdrant"
WAIT_TIMEOUT=30         # seconds to wait for Container to be ready

WEB_PORT=3001

# Track background PIDs
PIDS=()

cleanup() {
  echo "🛑 Shutting down all processes..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      echo "   Killing PID $pid"
      kill "$pid" 2>/dev/null
    fi
  done
  exit "${1:-0}"
}

fail() {
  echo "❌ $1"
  cleanup 1
}

trap cleanup SIGINT SIGTERM

# ─────────────────────────────────────────────
# Start or restart the Ollama container
# ─────────────────────────────────────────────
echo "🔍 Checking for existing Ollama container..."

if docker ps -a --format '{{.Names}}' | grep -q "^${OLLAMA_CONTAINER_NAME}$"; then
  STATUS=$(docker inspect -f '{{.State.Status}}' "$OLLAMA_CONTAINER_NAME")

  if [ "$STATUS" = "running" ]; then
    echo "✅ Container '$OLLAMA_CONTAINER_NAME' is already running."
  else
    echo "▶️  Starting existing container '$OLLAMA_CONTAINER_NAME'..."
    docker start "$OLLAMA_CONTAINER_NAME"
  fi
else
  echo "🚀 Creating and starting Ollama container..."
  docker run -d \
    --gpus=all \
    -v ollama:/root/.ollama \
    -p "${OLLAMA_HOST_PORT}:${OLLAMA_CONTAINER_PORT}" \
    --name "$OLLAMA_CONTAINER_NAME" \
    ollama/ollama
fi

# ─────────────────────────────────────────────
# Wait for Ollama API to be ready
# ─────────────────────────────────────────────
echo "⏳ Waiting for Ollama to be ready on port ${OLLAMA_HOST_PORT}..."

ELAPSED=0
until curl -s "http://localhost:${OLLAMA_HOST_PORT}" > /dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$WAIT_TIMEOUT" ]; then
    echo "❌ Ollama did not become ready within ${WAIT_TIMEOUT} seconds. Exiting."
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

echo "✅ Ollama is ready."

echo "🔍 Checking for existing Qdrant container..."

if docker ps -a --format '{{.Names}}' | grep -q "^${QDRANT_CONTAINER_NAME}$"; then
  STATUS=$(docker inspect -f '{{.State.Status}}' "$QDRANT_CONTAINER_NAME")

  if [ "$STATUS" = "running" ]; then
    echo "✅ Container '$QDRANT_CONTAINER_NAME' is already running."
  else
    echo "▶️  Starting existing container '$QDRANT_CONTAINER_NAME'..."
    docker start "$QDRANT_CONTAINER_NAME"
  fi
else
  echo "🚀 Creating and starting Ollama container..."
  docker run -d \
    -p "${QDRANT_HOST_PORT}:${QDRANT_CONTAINER_PORT}" \
    --name "$QDRANT_CONTAINER_NAME" \
    qdrant/qdrant
fi

# ─────────────────────────────────────────────
# Wait for QDrant to be ready
# ─────────────────────────────────────────────
echo "⏳ Waiting for QDrant to be ready on port ${QDRANT_HOST_PORT}..."

ELAPSED=0
until curl -s "http://localhost:${QDRANT_HOST_PORT}" > /dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$WAIT_TIMEOUT" ]; then
    echo "❌ QDrant did not become ready within ${WAIT_TIMEOUT} seconds. Exiting."
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

echo "✅ QDrant is ready."

# ─────────────────────────────────────────────
# Build the Fangorn Agent
# ─────────────────────────────────────────────
echo "🔨 Building Fangorn Agent..."

npm run build || fail "Build failed."

echo "✅ Build successful."

echo "🖥️ Starting up UI..."

cd web-app
npm run dev & UI_PID=$!
PIDS+=("$UI_PID")

cd ../

# ─────────────────────────────────────────────
# Start the Web Server
# ─────────────────────────────────────────────
echo "🌐 Starting web chat server at http://localhost:${WEB_PORT}..."

OLLAMA_PORT="$OLLAMA_HOST_PORT" MODEL="$MODEL" PORT="$WEB_PORT" QDRANT_PORT="$QDRANT_HOST_PORT" node build/server.js &
SERVER_PID=$!
PIDS+=("$SERVER_PID")

# Wait for the server process — if it exits unexpectedly, clean up everything
wait $SERVER_PID
SERVER_EXIT=$?

if [ "$SERVER_EXIT" -ne 0 ]; then
  fail "Web server exited with code $SERVER_EXIT."
fi

cleanup 0