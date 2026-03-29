'use client';

import { FileEntry, Schema } from '@/types/subgraph';
import FangornUI from './FangornUI';

/**
 * Maps raw MCP tool results into FangornUI props and renders the component.
 *
 * mcpResults is an array of { toolName, data } objects from the backend.
 * onSendMessage is the chat's send function, wired to FangornUI's
 * sendPrompt so interactive actions (filter, purchase, prefetch) go
 * back through the agent.
 */
export default function McpResultRenderer({
  mcpResults,
  onSendMessage,
}: {
  mcpResults: { toolName: string; schemaData: Schema[], fileData: FileEntry[], data: any };
  onSendMessage?: (message: string) => void;
}) {
  console.log("McpRenderer called")
  if (!mcpResults ) return null;

  // Use the last MCP result to determine which mode to render
  // const lastResult = mcpResults[mcpResults.length - 1];
  // const { toolName, data } = lastResult;

  const {toolName, schemaData, fileData, data} = mcpResults;

  // Make sendPrompt available globally for FangornUI's internal calls
  // (QueryFlow, DataRecordCard use `typeof sendPrompt === "function"`)
  if (typeof window !== 'undefined' && onSendMessage) {
    (window as any).sendPrompt = onSendMessage;
  }

  if (toolName === 'subgraph_list_schemas') {
    // The MCP returns schemas — render in Browse mode
    const schemas = schemaData;
    return (
      <FangornUI
        mode="browse"
        schemas={schemas}
      />
    );
  }

  if (toolName === 'subgraph_query_data') {
    // The MCP returns data entries — render in Query mode
    // const { entries, schemaName } = extractDataEntries(data);
    const entries = fileData;
    return (
      <FangornUI
        mode="query"
        dataEntries={entries}
        querySchemaName={entries[0].id}
      />
    );
  }

  return null;
}

// ── Data extraction helpers ──────────────────────────────────────────

function deepParse(data: any): any {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return data; }
  }
  if (Array.isArray(data) && data.length > 0 && data[0]?.type === 'text' && data[0]?.text) {
    try { return JSON.parse(data[0].text); } catch { return data; }
  }
  if (data?.type === 'text' && data?.text) {
    try { return JSON.parse(data.text); } catch { return data; }
  }
  if (data?.content) {
    return deepParse(data.content);
  }
  return data;
}

function findArray(data: any, ...keys: string[]): any[] | null {
  for (const key of keys) {
    if (data?.[key] && Array.isArray(data[key])) return data[key];
  }
  if (data?.data) {
    for (const key of keys) {
      if (data.data[key] && Array.isArray(data.data[key])) return data.data[key];
    }
  }
  return null;
}

function extractSchemas(rawData: any): any[] {
  const data = deepParse(rawData);
  if (Array.isArray(data)) return data;
  const found = findArray(data, 'schemas', 'result', 'results', 'items');
  return found || [];
}

function extractDataEntries(rawData: any): { entries: any[]; schemaName: string } {
  const data = deepParse(rawData);
  let entries: any[] = [];
  let schemaName = '';

  if (Array.isArray(data)) {
    entries = data;
  } else {
    const found = findArray(data, 'entries', 'dataSources', 'result', 'results', 'items', 'data');
    entries = found || [];
  }

  if (entries.length > 0) {
    schemaName = entries[0]?.schema_name || entries[0]?.schemaName || '';
  }

  return { entries, schemaName };
}