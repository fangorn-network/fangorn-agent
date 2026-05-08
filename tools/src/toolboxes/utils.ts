import { DynamicStructuredTool } from "langchain";
import {
  DataContext,
  Toolbox,
  ToolboxEntry,
  ToolboxPlugin,
} from "@fangorn-network/agent-types";
import { join } from "path";
import { existsSync, readdirSync } from "fs";
import { pathToFileURL } from "url";

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
 * Scan the toolbox directory, load each plugin, and initialise
 * the ones the user has enabled via the UI.
 *
 * Each plugin's init() receives its own fields from the persisted
 * config so it can self-configure.
 */
export async function activateToolboxPlugins(
  toolboxDir: string,
  entries: ToolboxEntry[],
  dataContextProvider?: () => DataContext,
): Promise<Toolbox[]> {
  const toolboxes: Toolbox[] = [];

  if (!existsSync(toolboxDir)) {
    console.warn(`[toolboxes] Directory not found: ${toolboxDir}`);
    return toolboxes;
  }

  const entryMap = new Map(entries.map((e) => [e.id, e]));

  for (const dir of readdirSync(toolboxDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;

    const pluginPath = join(toolboxDir, dir.name, `${dir.name}.plugin`);
    const jsPath = `${pluginPath}.js`;
    const tsPath = `${pluginPath}.ts`;

    if (!existsSync(jsPath) && !existsSync(tsPath)) continue;

    const entry = entryMap.get(dir.name);

    if (!entry?.enabled) {
      console.warn(`[toolboxes] Disabled: ${dir.name}`);
      continue;
    }

    const importPath = existsSync(jsPath) ? jsPath : tsPath;

    try {
      const importUrl = pathToFileURL(importPath).href;
      const { default: plugin }: { default: ToolboxPlugin } =
        await import(importUrl);

      const toolbox = await plugin.init(entry.fields, dataContextProvider);
      toolboxes.push(toolbox);
      console.log(`[toolboxes] Loaded: ${dir.name}`);
    } catch (err: any) {
      console.error(`[toolboxes] Failed to load ${dir.name}:`, err.message);
    }
  }

  return toolboxes;
}