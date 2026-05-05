import { initializeToolbox, ToolboxPlugin } from "../../types.js";
import { TasteToolbox } from "./tasteToolbox.js";

export default {
	enabled: (config) => config.agent0SdkToolConfig.enabled,
	init: async (config, dataContextProvider) => {
		const toolbox = await initializeToolbox(TasteToolbox, config);
		return toolbox
	},
} satisfies ToolboxPlugin