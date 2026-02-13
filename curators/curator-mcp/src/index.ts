import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const server = new McpServer({
  name: "data-agent",
  version: "1.0.0",
});

// ── Tools ───────────────────────────────────────────────────────────────

server.registerTool(
  "find_game",
  {
    description: "Find information about a video game by name",
    inputSchema: {
      name: z.string().describe("The name of the game to search for"),
    },
  },
  async ({ name }) => {
    const gameData = {
      title: name,
      genre: "Action RPG",
      platform: ["PC", "PS5", "Xbox Series X"],
      rating: 8.7,
      releaseYear: 2024,
      publisher: "Phantom Studios",
      description: `${name} is an expansive open-world action RPG set in a dystopian future.`,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(gameData, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "find_music",
  {
    description: "Find information about a song by name",
    inputSchema: {
      name: z.string().describe("The name of the song to search for"),
    },
  },
  async ({ name }) => {
    const musicData = {
      title: name,
      artist: "The Velvet Currents",
      album: "Midnight Architecture",
      genre: "Indie Rock",
      durationSeconds: 237,
      releaseYear: 2025,
      bpm: 122,
      key: "C minor",
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(musicData, null, 2),
        },
      ],
    };
  }
);

const app = express();

const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  transport.onclose = () => {
    const sid = transport.sessionId;
    if (sid) transports.delete(sid);
  };

  await server.connect(transport);
  await transport.handleRequest(req, res);

  if (transport.sessionId) {
    transports.set(transport.sessionId, transport);
  }
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
    return;
  }
  res.status(400).json({ error: "No valid session. Send a POST first." });
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
    transports.delete(sessionId);
    return;
  }
  res.status(400).json({ error: "No valid session." });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Data MCP Server listening on http://localhost:${PORT}/mcp`);
});