import express from "express";
import cors from "cors";
import { FangornAgentResponse, FangornAgent } from "agent";
import { DataContext } from "agent-types";
import { fangornAgentConfig } from "./config.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

declare global {
  namespace Express {
    interface Locals {
      dataContext: DataContext;
    }
  }
}

async function main() {
  app.locals.dataContext = {};
  const dataContextProvider: () => DataContext = () => {
    return app.locals.dataContext;
  };
  const agent = await FangornAgent.create(
    fangornAgentConfig,
    dataContextProvider,
  );

  console.log("Fangorn Agent created!");

  // Make agent accessible in the route handler
  app.locals.agent = agent;

  app.post("/tool-scoped-chat", async (req, res) => {
    const { message, dataContext, toolNameList } = req.body;
    console.log(`req.body: ${JSON.stringify(req.body, null, 2)}`);
    app.locals.dataContext = dataContext ?? {};
    console.log(`received message: ${message}`);
    if (!message) return res.status(400).json({ error: "No message provided" });
    try {
      console.log(`toolNameList: ${toolNameList}`);
      let toolNameListFinal = [];
      if (toolNameList) {
        toolNameListFinal = toolNameList;
      }
      const agentResponse: FangornAgentResponse =
        await agent.toolScopedAgenticChat(message, toolNameListFinal);
      agent.reset();
      app.locals.dataContext = {};
      res.json({
        response: agentResponse.text,
        mcpResults: agentResponse.mcpResults ?? undefined,
      });
      // console.log(`The response got turned into JSON and here it is parsed as a string: ${JSON.stringify(res)}`)
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Agent error" });
    }
  });

  app.post("/all-tool-chat", async (req, res) => {
    const { message, dataContext, toolNameList } = req.body;
    console.log(`req.body: ${JSON.stringify(req.body, null, 2)}`);
    app.locals.dataContext = dataContext ?? {};
    console.log(`received message: ${message}`);
    if (!message) return res.status(400).json({ error: "No message provided" });
    try {
      console.log(`toolNameList: ${toolNameList}`);
      let toolNameListFinal = [];
      if (toolNameList) {
        toolNameListFinal = toolNameList;
      }
      const agentResponse: FangornAgentResponse =
        await agent.fullAgenticChat(message);
      agent.reset();
      app.locals.dataContext = {};
      res.json({
        response: agentResponse.text,
        mcpResults: agentResponse.mcpResults ?? undefined,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Agent error" });
    }
  });

  app.post("/find-similar", async (req, res) => {
    const { data } = req.body;
    const agentResponse: FangornAgentResponse = await agent.findSimilar(data);
    agent.reset();
    app.locals.dataContext = {};
    res.json({
      response: agentResponse.text,
      mcpResults: agentResponse.mcpResults ?? undefined,
    });
  });

  app.post("/get-filters", async (req, res) => {
    const { data } = req.body;
    const agentResponse: FangornAgentResponse = await agent.returnFilters(data);
    agent.reset();
    app.locals.dataContext = {};
    res.json({
      response: agentResponse.text,
      mcpResults: agentResponse.mcpResults ?? undefined,
    });
  });

  app.get("/tools", async (_req, res) => {
    console.log("Request to retrieve tool names receieved");
    const toolInfo = agent.getAllToolNames();
    console.log(toolInfo);
    res.json({
      response: toolInfo,
    });
  });
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    console.log(`Chat endpoint running at http://localhost:${PORT}`);
  });

  app.get("/toolbox-map", async (_req, res) => {
    try {
      const toolBoxMap: Map<string, string[]> = agent.getToolBoxToolNamesMap();
      console.log(JSON.stringify(toolBoxMap));
      // Convert Map to a plain object for JSON serialization
      const payload: Record<string, string[]> = {};
      toolBoxMap.forEach((toolNames, boxName) => {
        payload[boxName] = toolNames;
      });
      res.json(payload);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to retrieve toolbox map" });
    }
  });
}

main();
