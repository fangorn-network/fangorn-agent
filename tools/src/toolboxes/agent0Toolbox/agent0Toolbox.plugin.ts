import { initializeToolbox, type ToolboxPlugin } from "@fangorn-network/agent-types";
import { Agent0Toolbox } from "./agent0Toolbox.js";

export default {
  init: async (config, _dataContextProvider) => {
    const toolbox = await initializeToolbox(Agent0Toolbox, config);
    return toolbox;
  },
} satisfies ToolboxPlugin;
