import { FangornToolboxConfig, initializeToolbox, ToolboxPlugin } from "@fangorn-network/agent-types";
import { FangornToolbox } from "./fangornToolbox.js";

export default {
  init: async (config: FangornToolboxConfig, dataContextProvider) => {
    const toolbox = await initializeToolbox(FangornToolbox, config);
    (toolbox as FangornToolbox).setDataContextProvider(dataContextProvider!);
    return toolbox;
  },
} satisfies ToolboxPlugin;
