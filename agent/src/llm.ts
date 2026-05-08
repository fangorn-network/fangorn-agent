import { AgenticConfig, LLMProvider } from "@fangorn-network/agent-types";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";

export type FangornAgentModel = ChatOllama | ChatAnthropic;

export function getFangornAgentModel(agenticConfig: AgenticConfig): FangornAgentModel {
  console.log("GetFangornAgentModel called")
  let model: FangornAgentModel;
  const llmProvider = agenticConfig.llmProvider
  const llmModel = agenticConfig.llmModel
  const baseUrl = agenticConfig.url
  const apiKey = agenticConfig.apiKey
  if (llmProvider === LLMProvider.Ollama) {
    model = new ChatOllama({
      model: llmModel,
      verbose: false,
      baseUrl,
    });
  } else {
    model = new ChatAnthropic({
      model: llmModel,
      maxRetries: 3,
      anthropicApiKey: apiKey
    });
  }
  return model;
}
