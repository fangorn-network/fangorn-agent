# Fangorn Agent

### About
The Fangorn Agent is an experiment in personal agent development. Currently, the top models for agent development are ChatGPT and Claude. However, these models are extremely expensive to run and do not really fit into the "personal" portion of a personal agent. Therefore, the Fangorn Agent is first and foremost meant to be able to run on consumer grade hardware. 

### Stack
- LangChain
- Ollama
- Typescript
- Docker

### Computer Spec information:
This agent is intended to be run on consumer grade hardware, but even so the current `qwen3.5:9b` model is somewhat heavy (~8GB of VRAM if using an NVIDIA GPU). These are the specs of a computer that can run the agent:

- Form factor: Full Tower
- OS: Ubuntu 24.04.3 LTS
    - Kernel Version: Linux 6.17.0-14-generic
- GPU: NVIDIA GeForce RTX™ 2080 Ti
- CPU: AMD Ryzen™ 9 9900X × 24
- RAM: 32 GB DDR5
- Storage: Samsung 970 EVO NVMe SSD 500 GB

Also note that the `qwen3.5:4b` model also reliably executes the available tool flows and only uses ~6GB of VRAM.

## Pre-reqs for Ollama:
1. Have [Docker](https://docs.docker.com/) installed
2. Install the Ollama docker [image](https://hub.docker.com/r/ollama/ollama)
    - If you have an NVIDIA GPU you would like to use, note that there are specific instructions you must follow to allow for it to be used in a Docker environment.

## Pre-reqs for Claude (Always use Claude for Fangorn Explorer/Fangorn MCP interactions):
1. Obtain an API key and credits from console.anthropic.com
2. Include API info in `.env`

## Pre-reqs
1. Make run_agent.sh and run_web.sh executable `chmod +x run_agent.sh` and `chmod +x run_web.sh`.
2. (Ollama only) Run the ollama container then download the `qwen3.5:9b` (or `qwen3.5:4b`) model `docker exec -it ollama ollama pull qwen3.5:9b`.
3. Ensure you have `pnpm` installed
4. Run `pnpm i` at the root of the agent project
5. Run `pnpm i` at the root of the web-app directory
7. Run `cp env.example .env` and fill in the information
8. (OPTIONAL) Ensure you have OAuth2.0 tokens created for the gmail address you wish to use and `USE_GMAIL=true`

## To run

Run `./run.sh` at the root of the project

## Agent Components

### server.ts

The Express.js server for communicating with the agent.

### FangornAgent.ts

This is the core of the agent and where the agent loop runs and the toolbay is initialized

#### run.sh
This runs the LLM within the Docker container, builds and starts the agent.

> **Note:** If you have an issue with port 11434 being taken, verify that Ollama (not the container) isn't starting on system startup and taking that port.

## Useful commands when using Ollama with Docker
- **Running the container (with GPU support)**: `docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama`
- **Running the container (CPU only)**: `docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama`
- **Download model (container already running):** `docker exec -it ollama ollama pull your-desired-model`
- **Models already downloaded to the container**: `curl http://localhost:11434/api/tags`
- **Remove model:** `docker exec -it ollama ollama rm your-desired-model`
- **Currently running models and their memory usage**: `curl http://localhost:11434/api/ps`
- **Stopping the container:** `docker stop ollama`
- **Force stopping the container:** `docker kill ollama`
- **Removing the container:** `docker rm ollama`

### Debugging port being taken (Linux)
- Find what's using the port `sudo lsof -i :11434`
- If it is ollama, you can check if it's running as a system service `systemctl status ollama`
- If that's it you can stop it with: `sudo systemctl stop ollama`
- You can also stop it from being auto-started on boot if you'd like: `sudo systemctl disable ollama`

If you'd like to see what models are offered by Ollama that support tool calling, you can check [here](https://ollama.com/search?c=tools)

### Known issues
- Anthropic limiting: There are times (even if you have a sufficient balance) that Anthropic will deny calls to Claude. Switching between `claude-opus-4-6` and `claude-sonnet-4-6` seems to remedy this issue.
- `/chat` endpoint unavailable: If an error occurs during agent startup when running `run_web.sh`, the NextJs server is not always killed. In this case, when you run `./run_web.sh` again, it will start another NextJs server which will occupy the port typically used by the agent. Use `ps aux` to list all process, and kill any orphaned nextjs instances.
- On Ubuntu there may be an issues with mismatching GPU driver versions after updates. Symptoms of this are high CPU core usage and sluggish tool call usage. You can verify this by running `docker exec -it ollama nvidia-smi` which will return information about your GPU (driver versions match and it's working) or it will return `Failed to initialize NVML: Unknown Error`. If you receive an error, stop any ollama instance `docker stop ollama` and remove the container `docker rm ollama`. You can then re-run `run.sh` which will completely re-build the container. 


# TODOs:
1. When an agent calls a toolbox, it gets back ALL of the tools in the toolbox. We should investigate a way to minimize the amount of tools returned by a toolbox. One idea may be that the agent requests a specific tool from the toolbox instead of getting them all.
2. The LLM now runs within a container, but the `run_agent.sh` script should allow for more options (CPU only, GPU, what model, etc.)
3. Right now all of our toolboxes are included. We should consider using `clack` to allow for a user to select what toolboxes they would like to include before starting the agent.
4. Implement dynamic filtering for all Blocks in the Fangorn Explorer.
5. Ensure clean handling of failures in `run_web.sh`