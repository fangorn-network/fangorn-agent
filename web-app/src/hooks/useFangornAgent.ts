// hooks/useFangornAgent.ts
//
// CHANGE SUMMARY vs your original:
//   1. sendMessage now reads `toolNameList` from a ref you pass in,
//      so the selected tools are always current without re-creating the callback.
//   2. Removed the hardcoded `const toolNameList = ["send_email"]`.
//   3. Added `toolNameListRef` parameter to the hook.
//   4. Everything else is identical.

import { useState, useCallback, MutableRefObject } from "react";

export type ChatMode = "tool-scoped" | "full-agentic";

export interface ChatEntry {
  id: number;
  role: "user" | "claude" | "system" | "mcp-result";
  message?: string;
  displayMessage?: string;
  resultType?:
    | "schemas"
    | "schema_entries"
    | "manifest_states"
    | "manifests"
    | "files"
    | "fields";
  data?: any;
  contextLabel?: string;
  contextType?: "schema" | "manifest" | "file" | "field";
}

export interface SendOptions {
  silent?: boolean;
  contextLabel?: string;
  displayMessage?: string;
  contextType?: "schema" | "manifest" | "file";
  dataContext?: string;
}

interface AgentState {
  loading: boolean;
  error: string | null;
  chatHistory: ChatEntry[];
}

interface UseFangornAgentOptions {
  /**
   * A ref to the current list of selected tool names.
   * Using a ref avoids re-creating the sendMessage callback on every selection change.
   */
  toolNameListRef: MutableRefObject<string[]>;
  /**
   * A ref to the current chat mode.
   * "tool-scoped" hits /tool-scoped-chat with the selected tools.
   * "full-agentic" hits /all-tool-chat with all tools available.
   */
  chatModeRef: MutableRefObject<ChatMode>;
}

let entryId = 0;

export function useFangornAgent({ toolNameListRef, chatModeRef }: UseFangornAgentOptions) {
  const [state, setState] = useState<AgentState>({
    loading: false,
    error: null,
    chatHistory: [],
  });

  const sendMessage = useCallback(
    async (message: string, options?: SendOptions) => {
      const silent = options?.silent ?? false;
      const contextLabel = options?.contextLabel;
      const contextType = options?.contextType;
      const displayMessage = options?.displayMessage;
      const dataContext = options?.dataContext;

      // Read the current selection from the ref
      const toolNameList = toolNameListRef.current;
      const chatMode = chatModeRef.current;

      if (!silent) {
        const userEntry: ChatEntry = {
          id: ++entryId,
          role: "user",
          message,
          displayMessage,
          contextLabel,
          contextType,
        };

        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          chatHistory: [...prev.chatHistory, userEntry],
        }));
      } else {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";

        const endpoint =
          chatMode === "full-agentic" ? "all-tool-chat" : "tool-scoped-chat";

        const body =
          chatMode === "full-agentic"
            ? { message, dataContext }
            : { message, dataContext, toolNameList };

        const res = await fetch(`${apiUrl}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`Agent returned ${res.status}`);
        const data = await res.json();

        const newEntries: ChatEntry[] = [];

        if (data.response) {
          newEntries.push({
            id: ++entryId,
            role: "claude",
            message: data.response,
            contextLabel,
            contextType,
          });
        }

        if (data.mcpResults) {
          const result = data.mcpResults;
          newEntries.push({
            id: ++entryId,
            role: "mcp-result",
            resultType: result.resultType,
            data: result.data,
            contextLabel,
            contextType,
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
    },
    [toolNameListRef, chatModeRef],
  );

  return { ...state, sendMessage };
}