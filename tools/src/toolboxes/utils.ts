import { DynamicStructuredTool } from "langchain";
import {
  DataContext,
  FangornAgentToolConfig,
  Toolbox,
  ToolboxPlugin,
} from "../types.js";
import { dirname, join } from "path";
import { existsSync, readdirSync } from "fs";
import { fileURLToPath } from "url";

export function getToolsByName(
  tools: DynamicStructuredTool[],
  toolNames: string[],
): Map<String, DynamicStructuredTool> {
  const matchingToolMap = new Map(
    tools
      .filter((tool) => toolNames.includes(tool.name))
      .map((tool) => [tool.name, tool]),
  );
  return matchingToolMap;
}

/**
 * Activate toolbox plugins. We expect toolbox plugins to be stored in the toolboxes directory with a toolbox directory of the same name.
 * We also expect the naming convention *.plugin.{ts,js}
 * IE: toolboxes/specificPluginToolbox/specificPluginToolbox.ts
 * */
export async function activateToolboxPlugins(
  config: FangornAgentToolConfig,
  dataContextProvider: () => DataContext,
): Promise<Toolbox[]> {
  const toolboxes: Toolbox[] = [];
  const __dirname = dirname(fileURLToPath(import.meta.url));
  for (const dir of readdirSync(__dirname, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const pluginPath = join(__dirname, dir.name, `${dir.name}.plugin`);
    if (!existsSync(`${pluginPath}.ts`) && !existsSync(`${pluginPath}.js`))
      continue;
    const { default: plugin }: { default: ToolboxPlugin } = await import(
      `${pluginPath}.js`
    );
    if (plugin.enabled(config)) {
      toolboxes.push(await plugin.init(config, dataContextProvider));
    } else {
      console.warn(`${dir.name} plugin is not enabled`);
    }
  }
  return toolboxes;
}
