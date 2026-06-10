import { initializeToolbox, ToolboxPlugin } from "@fangorn-network/agent-types";
import { CodingToolbox } from "./codingToolbox.js";

export default {
  init: async (config, _dataContextProvider) => {
    const toolbox = await initializeToolbox(CodingToolbox, config);
    return toolbox;
  },
} satisfies ToolboxPlugin;
