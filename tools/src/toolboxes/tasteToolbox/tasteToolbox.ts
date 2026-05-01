import { DynamicStructuredTool, tool } from "langchain";
import { Toolbox } from "../../types.js";
import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export class TasteToolbox implements Toolbox {

	public name = "taste_toolbox"

	private dirName = dirname(fileURLToPath(import.meta.url));
	private tasteMdRelativePath = "../../../../TASTE.md"
	private hasReadTaste = false

	static async init(): Promise<TasteToolbox> {
		return new TasteToolbox();
	}

	constructor() {}

	getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool> {
		const matchingToolMap = new Map(
			this.getTools()
			.filter((tool) => toolNames.includes(tool.name))
			.map(tool => [tool.name, tool])
		)
		return matchingToolMap
	}

	getTools(): DynamicStructuredTool[] {
		const readTaste = tool(
			async () => {
				console.log("console.log - agent called readTaste tool");

				try {

				const content = readFileSync(resolve(this.dirName, this.tasteMdRelativePath), "utf-8");


				console.log("CONTENT:")
				console.log(content)

				// this.hasReadTaste = true
				return JSON.stringify({
					status: 200,
					statusText: "OK",
					result:
						`What you know about the user's music taste: ${content}`,
				});
				}
				catch(e) {
					console.log(e)
				}
			},
			{
				name: 'read_taste',
				description:
					"Learn about what the user likes.",
				schema: z.object()
			},
		);

		const readTasteForUpdate = tool(
			async ({newTasteInfo}) => {
				console.log("console.log - agent called readTasteForUpdate tool");

				console.log("")

				if (newTasteInfo.includes("read_taste_for_update")) {
					return "This is not new taste info"
				}
				try {

				const content = readFileSync(resolve(this.dirName, this.tasteMdRelativePath), "utf-8");


				console.log("CONTENT:")
				console.log(content)

				this.hasReadTaste = true
				return JSON.stringify({
					status: 200,
					statusText: "OK",
					result:
						`Summarize the following: ${content} ${newTasteInfo}`,
				});
				}
				catch(e) {
					console.log(e)
				}
			},
			{
				name: 'read_taste_for_update',
				description:
					"Learn about what the user likes.",
				schema: z.object({
					newTasteInfo: z.string().describe("The new information you received regarding the user's taste.")
				})
			},
		);

		const updateTaste = tool(
			async ({newTasteSummary}) => {
				console.log("console.log - agent called updateTaste tool");
				console.log(newTasteSummary)
				console.log(JSON.stringify(newTasteSummary))

				console.log("Has read taste: ", this.hasReadTaste)

				if(!this.hasReadTaste) {
					console.log("Returning: Re-plan where you use the read_taste_for_update tool first")
					return JSON.stringify({
						status: 422,
						statusText: "Unprocessable Content",
						result:
							"Your call was well formed, but you need to use the read_taste_for_update tool first.",
					});
				}

				try {
					writeFileSync(resolve(this.dirName, this.tasteMdRelativePath), JSON.stringify(newTasteSummary), "utf-8")
					const content = readFileSync(resolve(this.dirName, this.tasteMdRelativePath), "utf-8");
					console.log("new taste summary: ", content)
					this.hasReadTaste = false
					return JSON.stringify({
						status: 200,
						statusText: "OK",
						result:
							"Taste updated successfully.",
					});
				} catch(e) {
					console.log(e)
				}
			},
			{
				name: 'update_taste',
				description:
					"Update what you know about the user's taste.",
				schema: z.object({
						newTasteSummary: z.string().describe("The summary you've created about the user's taste.")
				}),
			},
		);
		return [readTaste, readTasteForUpdate, updateTaste];
	}

	public getToolboxAsTool(): DynamicStructuredTool {
		const tasteToolboxTool = tool(
			async () => {
				console.log("console.log - agent called tasteToolboxTool tool");

				return JSON.stringify({
					status: 200,
					statusText: "OK",
					result:
						"Taste tools are now available. You now have access to: read_taste and update_taste. Re-plan and use them to complete the task.",
				});
			},
			{
				name: this.name,
				description:
					"Access tools that allow you to learn about the user's taste and update what you know about it.",
				schema: z.object({}),
			},
		);
		return tasteToolboxTool;
	}
}