import { initializeToolbox, ToolboxPlugin } from "../../types.js";
import { McpToolbox } from "./mcpToolbox.js";

export default {
	enabled: (config) => config.agent0SdkToolConfig.enabled,
	init: async (config, dataContextProvider) => {
		const fangornMcpUrl =
						config.mcpServerConfig.mcpServerUrls ?? ["http://localhost:4000"];
		const mcpToolbox = await McpToolbox.init(
						{
							fangornMcp: {
								transport: "http",
								url: fangornMcpUrl[0],
							},
						},
						"mcp_toolbox",
					);
		return mcpToolbox
	},
} satisfies ToolboxPlugin