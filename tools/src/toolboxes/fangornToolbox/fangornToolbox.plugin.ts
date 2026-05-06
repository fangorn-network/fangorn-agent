import { initializeToolbox, ToolboxPlugin } from "@fangorn-network/agent-types";
import { FangornToolbox } from "./fangornToolbox.js";

export default {
  enabled: (config) => config.fangornToolConfig.enabled,
  init: async (config, dataContextProvider) => {
    const toolbox = await initializeToolbox(FangornToolbox, config);
    (toolbox as FangornToolbox).setDataContextProvider(dataContextProvider);
    return toolbox;
  },
} satisfies ToolboxPlugin;
