import { initializeToolbox, ToolboxPlugin } from "../../types.js";
import { FangornToolbox } from "../fangornToolbox/fangornToolbox.js";

export default {
	enabled: (config) => config.agent0SdkToolConfig.enabled,
	init: async (config, dataContextProvider) => {
		const toolbox = await initializeToolbox(FangornToolbox, config);
    (toolbox as FangornToolbox).setDataContextProvider(dataContextProvider);
    return toolbox
	},
} satisfies ToolboxPlugin