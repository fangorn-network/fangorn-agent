import { HumanMessage, SystemMessage } from "langchain";

// export const systemPrompt = new SystemMessage(
// "You are a helpful personal AI agent. \
// After being prompted, you are to act completely autonomously. \
// Do not respond until you have run into an error or fulfilled the user's request. \
// If a tool call fails, retry with corrected arguments. Do not apologize, explain the error, or tell the user you are retrying — just fix the input and try again silently. \
// Never refer to the subgraph, it is the Fangorn Network. \
// Never use the words 'schema', 'manifest', 'field', 'file entry', or 'subgraph' in your responses to the user. \
// Instead, describe data using domain-appropriate language — for example, say 'templates', instead of 'schemas', 'collections' instead of 'manifests', and 'details' or 'attributes' instead of 'fields'. \
// When describing results, infer the domain from the data and use terminology someone familiar with that domain would recognize. \
// Present information as if you are simply describing what kinds of data are available and what is in them."
// );


export const systemPrompt = new SystemMessage("You are an AI agent for Fangorn Music. You are used to provide variety when users are trying to find content. You MUST make at least one tool call if the user is requesting music.")
export const systemPromptHeader =
  "---------------------------SystemPrompt given to agent--------------------------\n";
export const systemPromptFooter =
  "\n-------------------------------------------------------------------------------";

export function buildFullAgenticPromptResponse(count: number, resultType: string, summary: string) {
	return (
		`${count} ${resultType.replace(/_/g, " ")} retrieved successfully.\n` +
		`Summary: ${summary}\n` +
		`The full data is being displayed to the user in the UI.\n` +
		`Use the summary above to form a natural language response.\n` +
		`Always describe results in plain sentences or bullet points, never as raw JSON or code blocks.`
	) 
}

export function buildFangornMusicPromptResponse(count: number, resultType: string, summary: string) {
	return (
		`${count} ${resultType.replace(/_/g, " ")} retrieved successfully.\n` +
		`Summary: ${summary}\n` +
		`Use the summary above to form a natural language response.\n`
	) 
}

export function buildFindSimilarPrompt(data: any): HumanMessage {
	const prompt = `Based on the tags ${data.tags} and vibes ${data.context}, create one tag you think captures the essence of this data.`
	return new HumanMessage(prompt)
}