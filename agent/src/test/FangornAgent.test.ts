import { describe, it, expect, beforeEach, vi, beforeAll, afterEach, afterAll } from "vitest";
import { FangornAgent } from "../FangornAgent.js";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { fangornAgentToolConfig } from "./testConfigs.js";
import { DataContext } from "agent-tools";
import { fakeModel } from "langchain"
// import { getModelType } from "../llm.js";

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

const mockedLLM = fakeModel()

vi.mock("../llm.js", async () => {
  const actual = await vi.importActual("../llm.js");
  return {
    ...actual,
    getModelType: vi.fn((llmType) => {
			console.log("Getting mocked LLM instead of ", llmType)
			return mockedLLM
		}),
  };
});

let dataContextProvider: (() => DataContext)

	beforeAll(() => {
		server.listen()
		dataContextProvider = () => { return {}}
	})
	afterEach(() => server.resetHandlers())
	afterAll(() => server.close())

describe("Fangorn Agent", () => {
	it ("create successfully initializes the agent", () =>  {
		const agent = FangornAgent.create(fangornAgentToolConfig, dataContextProvider)
		expect(agent).toBeDefined()
	})
})