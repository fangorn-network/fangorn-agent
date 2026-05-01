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