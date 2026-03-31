// hooks/useFangornAgent.ts
import { useState, useCallback } from "react";

export interface ChatEntry {
  id: number;
  role: "user" | "claude" | "system" | "mcp-response";
  message?: string;
  resultType?: "schemas" | "schema_entries" | "manifest_states" | "manifests" | "file_entries" | "fields";
  data?: any;
}

interface AgentState {
  loading: boolean;
  error: string | null;
  chatHistory: ChatEntry[];
}

let entryId = 0;

export function useFangornAgent() {
  const [state, setState] = useState<AgentState>({
    loading: false,
    error: null,
    chatHistory: [],
  });

  const sendMessage = useCallback(async (message: string) => {
    // Add the user message to history
    const userEntry: ChatEntry = {
      id: ++entryId,
      role: "user",
      message,
    };

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      chatHistory: [...prev.chatHistory, userEntry],
    }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error(`Agent returned ${res.status}`);
      const data = await res.json();

      const newEntries: ChatEntry[] = [];

      // Add the LLM's text response if present
      if (data.response) {
        newEntries.push({
          id: ++entryId,
          role: "claude",
          message: data.response,
        });
      }

      // Add the MCP result if present
      if (data.mcpResults) {
        const result = data.mcpResults;
        newEntries.push({
          id: ++entryId,
          role: "mcp-response",
          resultType: result.resultType,
          data: result.data,
        });
      }

      setState((prev) => ({
        loading: false,
        error: null,
        chatHistory: [...prev.chatHistory, ...newEntries],
      }));
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