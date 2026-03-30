// hooks/useFangornAgent.ts
import { useState, useCallback, useRef } from "react";
import { Schema, FileEntry, ManifestState } from "@/types/subgraph";

interface AgentState {
  loading: boolean;
  error: string | null;
  schemas: Schema[];
  dataEntries: ManifestState[];
}

export function useFangornAgent() {
  const [state, setState] = useState<AgentState>({
    loading: false,
    error: null,
    schemas: [],
    dataEntries: [],
  });

  const sendMessage = useCallback(async (message: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error(`Agent returned ${res.status}`);
      const data = await res.json();

      if (data.mcpResults) {
        const result = data.mcpResults;
        if (result.toolName === "subgraph_list_schemas") {
        setState((prev) => ({loading: false, error: null, schemas: result.schemaData, dataEntries: prev.dataEntries}))
        } else if (result.toolName === "subgraph_query_data") {
            const manifestStates = result.fileData;
            console.log(`manifestStates: ${JSON.stringify(manifestStates, null, 2)}`)
            setState((prev) => ({ error: null, schemas:prev.schemas, dataEntries: manifestStates, loading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Unable to reach the Fangorn Agent. Make sure it is running.",
      }));
    }
  }, []);

  return { ...state, sendMessage };
}