import { initializeToolbox, ToolboxPlugin } from "@fangorn-network/agent-types";
import { GmailToolbox } from "./GmailToolbox.js";

export default {
  enabled: (config) => config.gmailConfig.enabled,
  init: async (config, dataContextProvider) => {
    const toolbox = await initializeToolbox(GmailToolbox, config);
    return toolbox;
  },
} satisfies ToolboxPlugin;
