# Fangorn Agent



## Pre-reqs:
1. Ensure ollama is installed `curl -fsSL https://ollama.com/install.sh | sh` and that the `glm-4.7-flash` model is installed `ollama pull glm-4.7-flash`
3. Ensure you have `pnpm` installed
4. Have the x402f library as a sibling directory to the fangorn agent and build it by running `npm run build` in its root directory
5. Ensure the facilitator and resource server in the x402f project are running

## To run
1. Run `cp .env.example .env` and fill in the information
1. Run `pnpm i` at the root of the project
2. Run `npm run dev`

## Components

### index.ts
This is the entry point for the agent. Here, the MCP client is built, the LLM is initialized, and the user interaction loop runs.

### mcpClient.ts 

This is where tools are created and the relevant SDKs and clients are initialized. There are 3 tools implemented:


1. **searchAgents(agentName)**: This tool is used by the agent to find other agents by their human readable name. It currently assumes that the human readable name is unique. The human is responsible for specifying the target agent's human readable name in their query.
2. **getAgentCard(a2aEndpoint)**: This allows the agent to retrieve the target agent's agent card as advertised in the `a2a` field. It assumes that the `a2a` field provides the base URL and that the agent card is located at `/.well-known/agent-card.json`
3. **callx402fAgent(agentName, tag, agentCardUrl, owner)**: This tool allows the agent to use the x402f middleware in order to fulfill the x402f requirements. The human is responsible for providing the filename (tag) for the agent in their query.


### searchAgents.ts
Agent lookup on Arbitrum Sepolia via the agent-0 sdk
`npm run search`
