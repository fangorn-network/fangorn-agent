"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const threadRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        return <Bubble key={entry.id} role="claude">Received data (type: {entry.resultType || "unknown"}).</Bubble>;
    }
  };

  return (
    <div style={{ padding: "1.5rem 0 2rem" }}>
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

      <div
        ref={threadRef}
        style={{
          background: "var(--color-background-secondary, #0e0e0e)",
          borderRadius: 20,
          border: "0.5px solid var(--color-border-secondary, #2a2a2a)",
          padding: 24,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 320,
          maxHeight: "75vh",
          overflowY: "auto",
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
    </div>
  );
}