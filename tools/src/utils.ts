import {
  FileEntry,
  ManifestState,
  SchemaState,
} from "@fangorn-network/client-types";

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
