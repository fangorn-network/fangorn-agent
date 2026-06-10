import express from "express";
import cors from "cors";
import { FangornAgentResponse, FangornAgent } from "@fangorn-network/agent";
import {
  AgentProgressEvent,
  DataContext,
  LLMProvider,
} from "@fangorn-network/agent-types";
import {
  agenticConfig,
  fangornAgentConfig,
  fullAgenticSystemPrompt,
  ollamaUrl,
  useMemory,
  workspaceRoot,
} from "./config.js";

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

  app.locals.agent = agent;

  // The model currently in use; changed via POST /model.
  let currentModel = agenticConfig.llmModel;

  /**
   * Run a chat as a Server-Sent Events stream so the UI can show
   * incremental progress (thoughts and tool activity) while the
   * agent loop works, followed by a final event with the answer.
   */
  async function streamChat(
    res: express.Response,
    run: (
      onEvent: (event: AgentProgressEvent) => void,
    ) => Promise<FangornAgentResponse>,
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (event: Record<string, any>) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      const agentResponse = await run(send);
      send({ type: "final", text: agentResponse.text });
    } catch (err) {
      console.error(err);
      send({ type: "error", message: "Agent error" });
    } finally {
      agent.reset();
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }

  app.post("/tool-scoped-chat", async (req, res) => {
    const { message, toolNameList } = req.body;
    console.log(`received message: ${message}`);
    if (!message) return res.status(400).json({ error: "No message provided" });
    await streamChat(res, (onEvent) =>
      agent.toolScopedAgenticChat(
        message,
        toolNameList ?? [],
        undefined,
        onEvent,
      ),
    );
  });

  app.post("/all-tool-chat", async (req, res) => {
    const { message } = req.body;
    console.log(`received message: ${message}`);
    if (!message) return res.status(400).json({ error: "No message provided" });
    await streamChat(res, (onEvent) =>
      agent.fullAgenticChat(message, fullAgenticSystemPrompt, onEvent),
    );
  });

  app.get("/tools", async (_req, res) => {
    res.json({ response: agent.getAllToolNames() });
  });

  app.get("/toolbox-map", async (_req, res) => {
    try {
      const toolBoxMap: Map<string, string[]> = agent.getToolBoxToolNamesMap();
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

  // List the models available from Ollama, plus which one is active.
  app.get("/models", async (_req, res) => {
    if (agenticConfig.llmProvider !== LLMProvider.Ollama) {
      return res.json({ current: currentModel, models: [] });
    }
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
      const data: any = await response.json();
      const models = (data.models ?? []).map((m: any) => ({
        name: m.name,
        parameterSize: m.details?.parameter_size,
        size: m.size,
      }));
      res.json({ current: currentModel, models });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not reach Ollama" });
    }
  });

  // Switch the model the agent uses.
  app.post("/model", async (req, res) => {
    const { model } = req.body;
    if (!model) return res.status(400).json({ error: "No model provided" });
    try {
      agent.changeModel({ ...agenticConfig, llmModel: model });
      currentModel = model;
      res.json({ current: currentModel });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to change model" });
    }
  });

  app.get("/config", async (_req, res) => {
    res.json({
      provider: agenticConfig.llmProvider,
      model: currentModel,
      workspaceRoot,
      useMemory,
    });
  });

  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    console.log(`Agent server running at http://localhost:${PORT}`);
  });
}

main();
