import { initializeToolbox, ToolboxPlugin } from "@fangorn-network/agent-types";
import { GmailToolbox } from "./GmailToolbox.js";
import { FangornToolConfig } from "../fangornToolbox/config.js";

export default {
  init: async (config: FangornToolConfig, _dataContextProvider) => {
    const toolbox = await initializeToolbox(GmailToolbox, config);
    return toolbox;
  },
} satisfies ToolboxPlugin;
