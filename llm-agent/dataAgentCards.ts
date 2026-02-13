import { AgentCard } from "./src/types/agentCardType.js";

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
      tags: ["datasource", "data", "games", "mcp"],
    },
    {
      id: "find-music",
      name: "Find Music",
      description: "Finds a song by name.",
      tags: ["datasource", "data", "music", "song", "mcp"],
    },
  ],

  provider: {
    organization: "Fangorn",
    url: "https://fangorn.network",
  },
},
  {
  name: "Game Data Source Agent",
  description: "An agent that sells video games.",
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
      id: "provide-data",
      name: "Provide Data",
      description: "Provides data.",
      tags: ["datasource", "data", "games", "rest"],
    },
  ],

  provider: {
    organization: "Fangorn",
    url: "https://fangorn.network",
  },
},
  {
  name: "Music Data Source Agent",
  description: "An agent that sells music.",
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
      id: "provide-data",
      name: "Provide Data",
      description: "Provides data.",
      tags: ["datasource", "data", "music", "rest"],
    },
  ],

  provider: {
    organization: "Fangorn",
    url: "https://fangorn.network",
  },
},
];