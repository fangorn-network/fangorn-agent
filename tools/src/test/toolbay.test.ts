import { describe, it, expect, beforeEach, vi, beforeAll, assert, afterEach, afterAll } from "vitest";
import { DataContext } from "../types.js";
import { fangornAgentToolConfig } from "./testConfigs.js";
import { ToolBay } from "../toolbay.js";

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.post("https://mcp.fangorn.network/mcp", async ({ request }) => {
    const body = await request.json();

    if (!body || typeof body !== "object" || !("method" in body)) {
      return HttpResponse.json({ error: "invalid body" }, { status: 400 });
    }

    if (body.method === "initialize") {
      return HttpResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "mock-fangorn", version: "1.0.0" },
        },
      });
    }

    if (body.method === "notifications/initialized") {
      return new HttpResponse(null, { status: 204 });
    }

    if (body.method === "tools/list") {
      return HttpResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          tools: [
        {
          name: "get_schema",
          description: "...",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_file_by_id",
          description: "...",
          inputSchema: { type: "object", properties: {} },
        },
          ],
        },
      });
    }

    if (body.method === "tools/call") {
      return HttpResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          content: [{ type: "text", text: JSON.stringify({ id: "123", name: "test" }) }],
        },
      });
    }

    return HttpResponse.json(
      { jsonrpc: "2.0", id: body.id, error: { code: -32601, message: "unknown method" } },
      { status: 400 }
    );
  }),
	
);

describe("The toolbay", () => {
	let dataContextProvider: () => DataContext;
	let toolbay: ToolBay;

	beforeAll(() => server.listen())
	afterEach(() => server.resetHandlers())
	afterAll(() => server.close())

	beforeEach( async () => {
		dataContextProvider = (() => {
			return   {excludeIds: ["abc"]}
		})
		toolbay = await ToolBay.initToolbay(dataContextProvider, fangornAgentToolConfig)

	})

	it ("Loads no tools initially", async () => {
		const toolboxes = toolbay.consumeDirty()
		expect(toolboxes.length).toBe(0)
	})

	it ("Loads all toolboxes when activateAgenticTools is called", async () => {
		toolbay.activateAgenticTools()
		const toolboxes = toolbay.consumeDirty()
		expect(toolboxes.length).toBe(5)
		const loadedToolboxNames = toolboxes.map((tb) => tb.name)

		expect(toolbay.getAllToolBoxNames()).toStrictEqual(loadedToolboxNames)
	})

	it ("Loads only the specified tools when activateTools is called", async () => {
		const toolsToActivate = ["x402f_fetch", "get_schema"]
		toolbay.activateTools([toolsToActivate[0]])
		let tools = toolbay.consumeDirty()
		expect(tools.length).toBe(1)
		expect(tools[0].name).toBe("x402f_fetch")
		toolbay.resetToolBay()
		toolbay.activateTools(toolsToActivate)
		tools = toolbay.consumeDirty()
		expect(tools.length).toBe(2)
		expect(tools[0].name).toBe(toolsToActivate[0])
		expect(tools[1].name).toBe(toolsToActivate[1])
	})

	it ("Clears loaded tools on reset", async () => {
		toolbay.activateTools(["x402f_fetch"])
		const tools = toolbay.consumeDirty()
		expect(tools.length).toBe(1)
		expect(tools[0].name).toBe("x402f_fetch")
		toolbay.resetToolBay()
		const resetTools = toolbay.consumeDirty()
		expect(resetTools.length).toBe(0)
	})

	it ("Clears loaded toolboxes on reset after agentic usage", async () => {
		toolbay.activateAgenticTools()
		let toolboxes = toolbay.consumeDirty()
		expect(toolboxes.length).toBe(5)
		toolbay.resetToolBay()
		toolboxes = toolbay.consumeDirty()
	})
	
	it ("Does not require tools to be passed in to activateTools", async () => {
		toolbay.activateTools([])
		const tools = toolbay.consumeDirty()
		expect(tools.length).toBe(0)
	})
})