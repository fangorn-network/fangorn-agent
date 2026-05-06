import { initializeToolbox, ToolboxPlugin } from "agent-types";
import { TasteToolbox } from "./tasteToolbox.js";

export default {
  enabled: (config) => config.useTasteTools,
  init: async (config, dataContextProvider) => {
    const toolbox = await initializeToolbox(TasteToolbox, config);
    return toolbox;
  },
} satisfies ToolboxPlugin;
