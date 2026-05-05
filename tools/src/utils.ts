import {
  FileEntry,
  ManifestState,
  SchemaState,
} from "@fangorn-network/client-types";
import { DataContext, FangornAgentToolConfig, Toolbox, ToolboxPlugin } from "./types.js";
import { join } from "path";
import { existsSync, readdirSync } from "fs";

/** 
 * Activate toolbox plugins. We expect toolbox plugins to be stored in the toolboxes directory with a toolbox directory of the same name.
 * We also expect the naming convention *.plugin.{ts, js}
 * IE: toolboxes/specificPluginToolbox/specificPluginToolbox.ts
 * */ 
export async function activateToolboxPlugins(config: FangornAgentToolConfig, dataContextProvider: (() => DataContext)): Promise<Toolbox[]> {
	const toolboxesDir = join(__dirname, "toolboxes");
	const toolboxes: Toolbox[] = [];
	for (const dir of readdirSync(toolboxesDir, { withFileTypes: true })) {
		if (!dir.isDirectory()) continue;
		const pluginPath = join(toolboxesDir, dir.name, `${dir.name}.plugin`);
		if (!existsSync(`${pluginPath}.ts`) && !existsSync(`${pluginPath}.js`)) continue;
		const { default: plugin }: { default: ToolboxPlugin } = await import(pluginPath);
		if (plugin.enabled(config)) {
			toolboxes.push(await plugin.init(config, dataContextProvider));
		}
	}
	return toolboxes
}

export function buildSummary(data: any, resultType: string): string {
  if (!Array.isArray(data)) return JSON.stringify(data).slice(0, 500);

  switch (resultType) {
    case "schemas": {
      console.log("Building summary for Schema States");
      const owners = [...new Set(data.map((s: SchemaState) => s.owner))];
      const schemaFields = data
        .filter((s: SchemaState) => (s.versions?.length ?? 0) > 0)
        .map((s: SchemaState) => {
          const fieldNames = [
            ...new Set(
              s.versions?.[s.versions.length - 1]?.fields?.map(
                (f: any) => f.name,
              ) ?? [],
            ),
          ];
          return `${s.name} [${fieldNames.join(", ")}]`;
        });
      return `Owners: ${owners.join(", ")}; Schemas: ${schemaFields.join("; ")}`;
    }
    case "manifest_states": {
      console.log("Building summary for Manifest States");
      const owners = [...new Set(data.map((ms: ManifestState) => ms.owner))];
      const manifests = data.map((ms: ManifestState) => {
        const fields = [
          ...new Set(
            ms.manifest?.files?.flatMap(
              (fe: FileEntry) => fe.fileFields?.map((f: any) => f.name) ?? [],
            ) ?? [],
          ),
        ];
        const values = [
          ...new Set(
            ms.manifest?.files?.flatMap(
              (fe: FileEntry) =>
                fe.fileFields?.map((f: any) =>
                  f.acc === "plain" ? f.value : "[encrypted]",
                ) ?? [],
            ) ?? [],
          ),
        ];
        return `${ms.schemaName} v${ms.version} [fields: ${fields.join(", ")}] [values: ${values.join(", ")}]`;
      });
      return `Owners: ${owners.join(", ")}; Manifests: ${manifests.join("; ")}`;
    }
    case "file_entries": {
      console.log("Building summary for File Entries");
      const fieldNames = [
        ...new Set(
          data.flatMap(
            (fe: FileEntry) => fe.fileFields?.map((f: any) => f.name) ?? [],
          ),
        ),
      ];
      const fieldValues = [
        ...new Set(
          data.flatMap(
            (fe: FileEntry) =>
              fe.fileFields?.map((f: any) =>
                f.acc === "plain" ? f.value : "[encrypted]",
              ) ?? [],
          ),
        ),
      ];
      return `Field names: ${fieldNames.join(", ")}; Field values: ${fieldValues.join(", ")}`;
    }
    default:
      console.log(`Result type was: ${resultType}`);
      return `${data.length} items`;
  }
}
