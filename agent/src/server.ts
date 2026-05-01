import express from "express";
import cors from "cors";
import { FangornAgentResponse, FangornAgent } from "./FangornAgent.js";
import { DataContext } from "./tools/types.js";
import { Agent } from "agent0-sdk";

const app = express();
app.use(cors());
app.use(express.json({limit: '10mb'}));

declare global {
  namespace Express {
    interface Locals {
      dataContext: DataContext
    }
  }
}

async function main() {
	app.locals.dataContext = {}
	const dataContextProvider: () => DataContext = (() => {
		return app.locals.dataContext
	})
  const agent = await FangornAgent.create(dataContextProvider);

  console.log("Fangorn Agent created!");

  // Make agent accessible in the route handler
  app.locals.agent = agent;

  app.post("/limitedChat", async (req, res) => {
    const { message, dataContext, toolNameList } = req.body;
		console.log(`req.body: ${JSON.stringify(req.body, null, 2)}`)
		app.locals.dataContext = dataContext ?? {}
    console.log(`received message: ${message}`)
    if (!message) return res.status(400).json({ error: "No message provided" });
    try {
			console.log(`toolNameList: ${toolNameList}`)
			let toolNameListFinal = []
			if (toolNameList) {
				toolNameListFinal = toolNameList
			}
      const agentResponse: FangornAgentResponse = await agent.limitedAgenticChat(message, toolNameListFinal);
      agent.reset()
			app.locals.dataContext = {}
      res.json({
        response: agentResponse.text,
        mcpResults: agentResponse.mcpResults ??  undefined,
      });
      // console.log(`The response got turned into JSON and here it is parsed as a string: ${JSON.stringify(res)}`)
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Agent error" });
    }
  });

	app.post("/fullChat", async (req, res) => {
    const { message, dataContext, toolNameList } = req.body;
		console.log(`req.body: ${JSON.stringify(req.body, null, 2)}`)
		app.locals.dataContext = dataContext ?? {}
    console.log(`received message: ${message}`)
    if (!message) return res.status(400).json({ error: "No message provided" });
    try {
			console.log(`toolNameList: ${toolNameList}`)
			let toolNameListFinal = []
			if (toolNameList) {
				toolNameListFinal = toolNameList
			}
      const agentResponse: FangornAgentResponse = await agent.fullAgenticChat(message);
      agent.reset()
			app.locals.dataContext = {}
      res.json({
        response: agentResponse.text,
        mcpResults: agentResponse.mcpResults ??  undefined,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Agent error" });
    }
  });

	app.post("/findSimilar", async (req, res) => {
		const {data} = req.body
		agent.findSimilar(data)
	})

	app.get("/tools", async (req, res) => {
		console.log("Request to retrieve tool names receieved")
		const toolInfo = agent.getAllToolNames()
		console.log(toolInfo)
		res.json({
			response: toolInfo
		})
	})
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    console.log(`Chat endpoint running at http://localhost:${PORT}`);
  });
}

main();