import { AgentCard } from "./types/agentCardType.js";

export const datasourceAgentCards: AgentCard[] = [
   {
  name: "MCP Entertainment Data Agent",
  description: "An MCP server that provides game and music lookup tools. Connect via MCP to discover and use its tools directly.",
  version: "1.0.0",

  supportedInterfaces: [
    {
      url: "http://localhost:3001/mcp",
      protocolBinding: "JSONRPC",
      protocolVersion: "1.0",
    },
  ],

  capabilities: {},

  defaultInputModes: ["text/plain", "application/json"],
  defaultOutputModes: ["text/plain", "application/json"],

  skills: [
    {
      id: "find-game",
      name: "Find Game",
      description: "Finds a video game by name.",
      tags: ["games", "search", "mcp", "tools"],
    },
    {
      id: "find-music",
      name: "Find Music",
      description: "Finds a song by name.",
      tags: ["music", "search", "song", "mcp", "tools"],
    },
  ],

  provider: {
    organization: "Fangorn",
    url: "https://fangorn.network",
  },
},
  {
  name: "Game Data Source Agent",
  description: "A REST based agent that provides the latest video game data.",
  version: "1.0.0",

  supportedInterfaces: [
    {
      url: "http://localhost:3000/games",
      protocolBinding: "HTTP+JSON",
      protocolVersion: "1.0",
    },
  ],

  capabilities: {},

  defaultInputModes: ["text/plain", "application/json"],
  defaultOutputModes: ["text/plain", "application/json"],

  skills: [
    {
      id: "obtain-x402f",
      name: "Obtain x402f",
      description: "Calling the agent via REST will result in the appropriate x402f response.",
      tags: ["datasource", "data", "games", "rest", "x402f"],
    },
  ],

  provider: {
    organization: "Fangorn",
    url: "https://fangorn.network",
  },
},
  {
  name: "Music Data Source Agent",
  description: "A REST based agent that provides the latest music data.",
  version: "1.0.0",

  supportedInterfaces: [
    {
      url: "http://localhost:3000/music",
      protocolBinding: "HTTP+JSON",
      protocolVersion: "1.0",
    },
  ],

  capabilities: {},

  defaultInputModes: ["text/plain", "application/json"],
  defaultOutputModes: ["text/plain", "application/json"],

  skills: [
    {
      id: "obtain-x402f",
      name: "Obtain x402f",
      description: "Calling the agent via REST will result in the appropriate x402f response.",
      tags: ["datasource", "data", "music", "rest", "x402f"],
    },
  ],

  provider: {
    organization: "Fangorn",
    url: "https://fangorn.network",
  },
},
];