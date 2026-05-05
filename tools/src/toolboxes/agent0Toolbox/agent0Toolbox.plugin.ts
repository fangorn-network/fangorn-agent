import { initializeToolbox, type ToolboxPlugin } from "../../types.js";
import { Agent0Toolbox } from "../../toolboxes/agent0Toolbox/agent0Toolbox.js";

export default {
	enabled: (config) => config.agent0SdkToolConfig.enabled,
	init: async (config, dataContextProvider) => {
		const toolbox = await initializeToolbox(Agent0Toolbox, config);
		return toolbox
	},
} satisfies ToolboxPlugin