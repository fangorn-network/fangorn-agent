import { useState, useCallback, MutableRefObject } from "react";
import { API_URL } from "@/lib/api";

export type ChatMode = "tool-scoped" | "full-agentic";

export interface ActivityItem {
  id: number;
  kind: "thought" | "note" | "tool";
  /** Thought/note text, or the tool name for kind "tool" */
  text: string;
  /** Short summary of the tool args, e.g. the file path or command */
  detail?: string;
  status?: "running" | "done" | "error";
}

export interface ChatEntry {
  id: number;
  role: "user" | "agent" | "system" | "activity";
  message?: string;
  /** Progress items for role "activity" */
  items?: ActivityItem[];
}

interface AgentState {
  loading: boolean;
  error: string | null;
  chatHistory: ChatEntry[];
}

interface UseAgentOptions {
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
let itemId = 0;

const MAX_THOUGHT_CHARS = 400;

/** Pick the most human-readable part of the tool args for display. */
function summarizeArgs(args: Record<string, any>): string {
  const value =
    args.path ?? args.command ?? args.query ?? args.nameContains ?? "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 80 ? text.slice(0, 80) + "…" : text;
}

export function useAgent({ toolNameListRef, chatModeRef }: UseAgentOptions) {
  const [state, setState] = useState<AgentState>({
    loading: false,
    error: null,
    chatHistory: [],
  });

  const sendMessage = useCallback(
    async (message: string) => {
      const toolNameList = toolNameListRef.current;
      const chatMode = chatModeRef.current;

      const userEntry: ChatEntry = {
        id: ++entryId,
        role: "user",
        message,
      };
      const activityEntry: ChatEntry = {
        id: ++entryId,
        role: "activity",
        items: [],
      };
      const activityId = activityEntry.id;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        chatHistory: [...prev.chatHistory, userEntry, activityEntry],
      }));

      const updateItems = (
        updater: (items: ActivityItem[]) => ActivityItem[],
      ) => {
        setState((prev) => ({
          ...prev,
          chatHistory: prev.chatHistory.map((entry) =>
            entry.id === activityId
              ? { ...entry, items: updater(entry.items ?? []) }
              : entry,
          ),
        }));
      };

      const pushItem = (item: Omit<ActivityItem, "id">) => {
        updateItems((items) => [...items, { ...item, id: ++itemId }]);
      };

      const finishTool = (name: string, ok: boolean) => {
        updateItems((items) => {
          const next = [...items];
          for (let i = next.length - 1; i >= 0; i--) {
            const item = next[i];
            if (
              item.kind === "tool" &&
              item.text === name &&
              item.status === "running"
            ) {
              next[i] = { ...item, status: ok ? "done" : "error" };
              break;
            }
          }
          return next;
        });
      };

      const handleEvent = (event: any): boolean => {
        // Returns true when the conversation turn is finished.
        switch (event.type) {
          case "thinking":
            pushItem({
              kind: "thought",
              text:
                event.text.length > MAX_THOUGHT_CHARS
                  ? event.text.slice(0, MAX_THOUGHT_CHARS) + "…"
                  : event.text,
            });
            return false;
          case "assistant_text":
            pushItem({ kind: "note", text: event.text });
            return false;
          case "tool_call":
            pushItem({
              kind: "tool",
              text: event.name,
              detail: summarizeArgs(event.args ?? {}),
              status: "running",
            });
            return false;
          case "tool_result":
            finishTool(event.name, event.ok !== false);
            return false;
          case "final": {
            const agentEntry: ChatEntry = {
              id: ++entryId,
              role: "agent",
              message:
                event.text ||
                "_The agent finished without a reply — it may have completed the work silently. Check the workspace or ask it what it did._",
            };
            setState((prev) => ({
              loading: false,
              error: null,
              chatHistory: [...prev.chatHistory, agentEntry],
            }));
            return true;
          }
          case "error":
            setState((prev) => ({
              ...prev,
              loading: false,
              error: event.message ?? "Agent error",
            }));
            return true;
          default:
            return false;
        }
      };

      try {
        const endpoint =
          chatMode === "full-agentic" ? "all-tool-chat" : "tool-scoped-chat";

        const body =
          chatMode === "full-agentic" ? { message } : { message, toolNameList };

        const res = await fetch(`${API_URL}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Agent returned ${res.status}`);
        }

        // Parse the SSE stream: events are "data: {json}" lines
        // separated by blank lines, ending with "data: [DONE]".
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finished = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let separatorIndex;
          while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
            const rawEvent = buffer.slice(0, separatorIndex).trim();
            buffer = buffer.slice(separatorIndex + 2);
            if (!rawEvent.startsWith("data: ")) continue;
            const payload = rawEvent.slice(6);
            if (payload === "[DONE]") continue;
            try {
              finished = handleEvent(JSON.parse(payload)) || finished;
            } catch {
              // Ignore malformed events
            }
          }
        }

        if (!finished) {
          throw new Error("Stream ended without a final response");
        }
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Unable to reach the agent server. Make sure it is running.",
        }));
      }
    },
    [toolNameListRef, chatModeRef],
  );

  return { ...state, sendMessage };
}
