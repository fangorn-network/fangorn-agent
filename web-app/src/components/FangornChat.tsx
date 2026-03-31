"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Schema, FileEntry, ManifestState, Manifest, Field } from "../types/subgraph";
import { Bubble, TypingDots } from "./primitives";
import {
  SchemaBlock,
  SchemaEntriesBlock,
  ManifestStatesBlock,
  ManifestsBlock,
  FileEntriesBlock,
  FieldsBlock,
} from "./index";
import { ChatEntry } from "@/hooks/useFangornAgent";

interface FangornChatProps {
  chatHistory: ChatEntry[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string) => void;
}

export default function FangornChat({
  chatHistory,
  loading,
  error,
  sendMessage,
}: FangornChatProps) {
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

  const renderEntry = (entry: ChatEntry) => {
    if (entry.role === "user") {
      return <Bubble key={entry.id} role="user">{entry.message}</Bubble>;
    }

    if (entry.role === "claude") {
      return <Bubble key={entry.id} role="claude">{entry.message}</Bubble>;
    }

    if (entry.role === "system") {
      return <Bubble key={entry.id} role="system">{entry.message}</Bubble>;
    }

    switch (entry.resultType) {
      case "schemas":
        return <SchemaBlock key={entry.id} schemas={Array.isArray(entry.data) ? entry.data : [entry.data]} sendMessage={sendMessage} />;

      case "schema_entries":
        return <SchemaEntriesBlock key={entry.id} entries={entry.data as any[]} />;

      case "manifest_states":
        return <ManifestStatesBlock key={entry.id} manifests={entry.data as ManifestState[]} sendMessage={sendMessage} />;

      case "manifests":
        return <ManifestsBlock key={entry.id} manifests={Array.isArray(entry.data) ? entry.data : [entry.data]} />;

      case "file_entries":
        return <FileEntriesBlock key={entry.id} entries={entry.data as FileEntry[]} />;

      case "fields":
        return <FieldsBlock key={entry.id} fields={entry.data as Field[]} />;

      default:
        if (entry.data) {
          return <Bubble key={entry.id} role="claude">Received data (type: {entry.resultType || "unknown"}).</Bubble>;
        }

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
              Welcome to Fangorn. What would you like to explore?
            </Bubble>
          )}

          {chatHistory.map((entry) => renderEntry(entry))}

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
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              background: "var(--color-background-primary, #141414)",
              border: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
              borderRadius: 12,
              padding: "8px 12px",
              transition: "border-color 0.15s",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
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
                background: input.trim() && !loading
                  ? "var(--color-text-primary, #fafafa)"
                  : "var(--color-border-tertiary, #1e1e1e)",
                color: input.trim() && !loading
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