import {
  FileEntry,
  ManifestState,
  SchemaState,
} from "@fangorn-network/client-types";

import { buildFangornMusicPromptResponse as buildShortenedPromptResponse } from "./prompts.js";

export function processDisplayData(data: any, resultType: string) {
  let agentPrompt;
  if (resultType !== "non-standard") {
    const count = Array.isArray(data) ? data.length : 1;
    const summary = buildSummary(data, resultType);
    agentPrompt = buildShortenedPromptResponse(count, resultType, summary);
    console.log(
      `result summary given to agent: ${JSON.stringify(agentPrompt, null, 2)}`,
    );
  } else {
    console.log("It was non-standard");
    console.log("resultType");
    agentPrompt = `${agentPrompt} \n\nIt looks like you made a raw query. The user will not get to see the full data in the UI.`;
  }
}

export function processToolResult(result: any, toolName: string) {
  let parsed: any;
  try {
    parsed = JSON.parse(result);
  } catch {
    // Plain-text tool result — pass it through untouched.
    return { finalResult: result, mcpData: undefined };
  }
  let finalResult = result;
  let displayData = parsed.displayData;
  let mcpData;
  // If this is an MCP tool whose data should be rendered in the UI,
  // stash the parsed result so the server can forward it to the frontend.
  if (displayData) {
    try {
      const data: any = parsed.data;
      const resultType: string = parsed.resultType;
      finalResult = processDisplayData(data, resultType);
      mcpData = { toolName, data, resultType };
    } catch {
      // If it doesn't parse, skip — the model still gets the string
      console.log(
        `[ToolBay] Could not parse MCP result for UI forwarding. Raw type: ${typeof result}, preview: ${String(result).slice(0, 200)}`,
      );
    }
  }
  return { finalResult, mcpData };
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
