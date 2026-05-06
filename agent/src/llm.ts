import { LLMProvider } from "@fangorn-network/agent-types";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";

export type FangornAgentModel = ChatOllama | ChatAnthropic;

export function getModelType(llmProvider: LLMProvider, llmModel: string): FangornAgentModel {
  let model: FangornAgentModel;
  if (llmProvider === LLMProvider.Ollama) {
    const ollamaPort = process.env.OLLAMA_PORT || 11434; // fallback to default if not set
    console.log(`running ${llmModel} model`);
    const baseUrl = `http://localhost:${ollamaPort}`;
    model = new ChatOllama({
      model: llmModel,
      verbose: false,
      baseUrl,
    });
  } else {
    model = new ChatAnthropic({
      model: llmModel,
      maxRetries: 3,
    });
  }
  return model;
}
