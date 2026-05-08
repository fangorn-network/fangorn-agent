import { initializeToolbox, ToolboxPlugin } from "@fangorn-network/agent-types";
import { TasteToolbox } from "./tasteToolbox.js";

export default {
  init: async (config, _dataContextProvider) => {
    const toolbox = await initializeToolbox(TasteToolbox, config);
    return toolbox;
  },
} satisfies ToolboxPlugin;
