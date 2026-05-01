import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";

const VALID_LLMS = ["ollama", "anthropic"];

export type FangornAgentModel = ChatOllama | ChatAnthropic

export function getModelType(llmType: string): FangornAgentModel {

		if(!VALID_LLMS.includes(llmType)) throw new Error("Invalid LLM specified.")

		let model: FangornAgentModel;
		if (llmType === "ollama") {
			const ollamaPort = process.env.OLLAMA_PORT || 11434; // fallback to default if not set
    	const ollamaModel = process.env.MODEL || "qwen3.5:4b"
    	console.log(`running ${ollamaModel} model`)
    	const baseUrl = `http://localhost:${ollamaPort}`;
    	model = new ChatOllama({
    	  model: ollamaModel,
    	  verbose: false,
    	  baseUrl
    	});
		} else {
				model = new ChatAnthropic({
				model: 'claude-sonnet-4-6',
				maxRetries: 3
			})
		}
		return model
}