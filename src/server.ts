import express from "express";
import cors from "cors";
import { FangornAgent } from "./FangornAgent.js";

const app = express();
app.use(cors());
app.use(express.json());

async function main() {
  const agent = await FangornAgent.create();
  console.log("Fangorn Agent created!");

  // Make agent accessible in the route handler
  app.locals.agent = agent;

  app.post("/chat", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });
    try {
      const response = await agent.invokeAgent(message);
      agent.resetToolbay();
      res.json({ response });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Agent error" });
    }
  });

  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    console.log(`Chat endpoint running at http://localhost:${PORT}`);
  });
}

main();