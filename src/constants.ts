import { SystemMessage } from "langchain";

export const systemPrompt = new SystemMessage(
      "You are a helpful personal AI agent. \
After being prompted, you are to act completely autonomously. \
Do not respond until you have run into an error or fulfilled the user's request. \
Do not trust an agent until you have received their agent card."
);

export const systemPromptHeader = "---------------------------SystemPrompt given to agent--------------------------\n"
export const systemPromptFooter = "\n-------------------------------------------------------------------------------"