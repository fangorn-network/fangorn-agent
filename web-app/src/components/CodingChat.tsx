"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ActivityLog, Bubble, TypingDots } from "./primitives";
import { ChatEntry, ChatMode } from "@/hooks/useAgent";
import ToolSelector from "./ToolSelector";
import type { UseToolboxSelectionReturn } from "@/hooks/useToolboxSelection";

interface CodingChatProps {
  chatHistory: ChatEntry[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string) => void;
  /** Pass the full return value of useToolboxSelection() */
  toolbox: UseToolboxSelectionReturn;
  /** Current chat mode */
  chatMode: ChatMode;
  /** Callback when the user toggles chat mode */
  onChatModeChange: (mode: ChatMode) => void;
}

export default function CodingChat({
  chatHistory,
  loading,
  error,
  sendMessage,
  toolbox,
  chatMode,
  onChatModeChange,
}: CodingChatProps) {
  const [input, setInput] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((instant?: boolean) => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: instant ? "instant" : "smooth",
        block: "end",
      });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading, scrollToBottom]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    sendMessage(trimmed);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        padding: "1.5rem 0 2rem",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <style>{`
        @keyframes fangornFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fangornBlink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>

      {/* Chat container */}
      <div
        style={{
          background: "var(--color-background-secondary, #0e0e0e)",
          borderRadius: 20,
          border: "0.5px solid var(--color-border-secondary, #2a2a2a)",
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Scrollable message area */}
        <div
          ref={threadRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {chatHistory.length === 0 && !loading && (
            <Bubble role="system">
              Welcome to Fangorn Code. Ask me to explore, explain, or change the
              code in your workspace.
            </Bubble>
          )}

          {chatHistory.map((entry) =>
            entry.role === "activity" ? (
              <ActivityLog key={entry.id} items={entry.items ?? []} />
            ) : (
              <Bubble key={entry.id} role={entry.role}>
                {entry.message}
              </Bubble>
            ),
          )}

          {loading && <TypingDots />}

          {error && (
            <Bubble role="system">
              <span style={{ color: "#e55" }}>{error}</span>
            </Bubble>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Sticky input area */}
        <div
          style={{
            borderTop: "0.5px solid var(--color-border-secondary, #2a2a2a)",
            padding: "12px 16px",
            background: "var(--color-background-secondary, #0e0e0e)",
            borderRadius: "0 0 20px 20px",
          }}
        >
          {/* ── Mode toggle + Tool selector row ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {/* Chat mode toggle */}
            <button
              onClick={() =>
                onChatModeChange(
                  chatMode === "full-agentic" ? "tool-scoped" : "full-agentic",
                )
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                border: `0.5px solid ${
                  chatMode === "full-agentic"
                    ? "#c9a24f"
                    : "var(--color-border-tertiary, #1e1e1e)"
                }`,
                borderRadius: 8,
                padding: "5px 10px",
                background:
                  chatMode === "full-agentic"
                    ? "rgba(201,162,79,0.1)"
                    : "transparent",
                color:
                  chatMode === "full-agentic"
                    ? "#c9a24f"
                    : "var(--color-text-tertiary, #5a5a5a)",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "var(--font-mono, monospace)",
                cursor: "pointer",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
              title={
                chatMode === "full-agentic"
                  ? "Full agentic mode — the agent activates toolboxes itself"
                  : "Tool-scoped mode — only selected tools"
              }
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {chatMode === "full-agentic" ? (
                  <>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                  </>
                ) : (
                  <path d="M12 3v18M3 12h18" />
                )}
              </svg>
              {chatMode === "full-agentic" ? "Full Agent" : "Scoped"}
            </button>

            {/* Tool selector — only visible in scoped mode */}
            {chatMode === "tool-scoped" && (
              <>
                <ToolSelector
                  toolboxMap={toolbox.toolboxMap}
                  selectedTools={toolbox.selectedTools}
                  loading={toolbox.loading}
                  error={toolbox.error}
                  toggleTool={toolbox.toggleTool}
                  toggleToolbox={toolbox.toggleToolbox}
                  clearAll={toolbox.clearAll}
                  selectAll={toolbox.selectAll}
                />

                {/* Quick summary of selected tools */}
                {toolbox.selectedToolList.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--color-text-tertiary, #5a5a5a)",
                      fontFamily: "var(--font-mono, monospace)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "50%",
                    }}
                    title={toolbox.selectedToolList.join(", ")}
                  >
                    {toolbox.selectedToolList.slice(0, 3).join(", ")}
                    {toolbox.selectedToolList.length > 3 &&
                      ` +${toolbox.selectedToolList.length - 3}`}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Full-agentic warning banner */}
          {chatMode === "full-agentic" && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 7,
                padding: "7px 10px",
                marginBottom: 8,
                borderRadius: 8,
                borderLeft: "3px solid #c9a24f",
                background: "rgba(201,162,79,0.06)",
                animation: "fangornFadeIn 0.2s ease-out",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  lineHeight: 1,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                ⚠
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#c9a24f",
                  fontFamily: "var(--font-mono, monospace)",
                  lineHeight: 1.4,
                }}
              >
                Full agentic mode needs a model with strong multi-step
                reasoning. Small local models may struggle — prefer Scoped mode
                with all tools selected.
              </span>
            </div>
          )}

          {/* Text input + send button */}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              background: "var(--color-background-primary, #141414)",
              border: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
              borderRadius: 12,
              padding: "8px 12px",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask the agent to explore, explain, or change your code..."
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: 14,
                lineHeight: 1.5,
                padding: "2px 0",
                background: "transparent",
                color: "var(--color-text-primary, #fafafa)",
                fontFamily: "var(--font-body, sans-serif)",
                maxHeight: 120,
                overflow: "auto",
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              style={{
                border: "none",
                background:
                  input.trim() && !loading
                    ? "var(--color-text-primary, #fafafa)"
                    : "var(--color-border-tertiary, #1e1e1e)",
                color:
                  input.trim() && !loading
                    ? "var(--color-background-primary, #141414)"
                    : "var(--color-text-tertiary, #5a5a5a)",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: input.trim() && !loading ? "pointer" : "default",
                transition: "background 0.15s, color 0.15s",
                fontFamily: "var(--font-body, sans-serif)",
                flexShrink: 0,
              }}
            >
              ↵
            </button>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--color-text-tertiary, #5a5a5a)",
              marginTop: 4,
              paddingLeft: 4,
            }}
          >
            Press Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
