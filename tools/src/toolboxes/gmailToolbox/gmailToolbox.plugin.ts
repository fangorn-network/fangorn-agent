import { initializeToolbox, ToolboxPlugin } from "../../types.js";
import { GmailToolbox } from "./GmailToolbox.js";

export default {
  enabled: (config) => config.gmailConfig.enabled,
  init: async (config, dataContextProvider) => {
    const toolbox = await initializeToolbox(GmailToolbox, config);
    return toolbox;
  },
} satisfies ToolboxPlugin;
