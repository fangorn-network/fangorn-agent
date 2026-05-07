import { ToolboxPlugin } from "@fangorn-network/agent-types";
import { McpToolbox } from "./mcpToolbox.js";

export default {
  init: async (config, _dataContextProvider) => {
    const fangornMcpUrl = config.mcpServerUrls ?? [
      "http://localhost:4000",
    ];
    const mcpToolbox = await McpToolbox.init(
      {
        fangornMcp: {
          transport: "http",
          url: fangornMcpUrl[0],
        },
      },
      "mcp_toolbox",
    );
    return mcpToolbox;
  },
} satisfies ToolboxPlugin;
