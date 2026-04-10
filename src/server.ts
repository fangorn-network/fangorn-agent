import express from "express";
import cors from "cors";
import { FangornAgent } from "./FangornAgent.js";

const app = express();
app.use(cors());
app.use(express.json({limit: '10mb'}));

async function main() {
	app.locals.dataContext = {}
	const dataContextProvider = (() => {
		return app.locals.dataContext
	})
  const agent = await FangornAgent.create(dataContextProvider);

  console.log("Fangorn Agent created!");

  // Make agent accessible in the route handler
  app.locals.agent = agent;

  app.post("/chat", async (req, res) => {
    const { message, dataContext } = req.body;
		console.log(`req.body: ${JSON.stringify(req.body, null, 2)}`)
		app.locals.dataContext = dataContext
    console.log(`received message: ${message}`)
    if (!message) return res.status(400).json({ error: "No message provided" });
    try {
			
      const { text, mcpResults } = await agent.invokeAgent(message);
      agent.resetToolbay();
			app.locals.dataContext = {}
      res.json({
        response: text,
        mcpResults: mcpResults ??  undefined,
      });
      // console.log(`The response got turned into JSON and here it is parsed as a string: ${JSON.stringify(res)}`)
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