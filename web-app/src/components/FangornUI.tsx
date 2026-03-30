"use client";

import { useState } from "react";
import { Schema, FileEntry, Manifest, ManifestState } from "../types/subgraph";
import { BrowseFlow } from "./BrowseFlow";
import { QueryFlow } from "./QueryFlow";

interface FangornUIProps {
  mode?: string;
  schemas: Schema[];
  schemaDetail?: Schema | null;
  dataEntries: ManifestState[];
  querySchemaName?: string;
  sendMessage: (message: string) => void;
}

export default function FangornUI({
  mode: initialMode = "browse",
  schemas,
  schemaDetail = null,
  dataEntries,
  querySchemaName = "",
  sendMessage,
}: FangornUIProps) {
  const [mode, setMode] = useState(initialMode);
  const [key, setKey] = useState(0);
  const [activeSchemaName, setActiveSchemaName] = useState(querySchemaName);
  const [autoLoad, setAutoLoad] = useState(false);

  const switchMode = (m: string) => {
    setMode(m);
    setAutoLoad(false);
    setKey((k) => k + 1);
  };

  const handleQuerySchema = (name: string) => {
    setActiveSchemaName(name);
    setAutoLoad(true);
    setMode("query")
    setKey((k) => k + 1);
    sendMessage(`Query the first 40 files whose manifest declares they conform to the schema "${name}". Use JSON response format.`);
  };

  return (
    <div style={{ padding: "1.5rem 0 2rem" }}>
      <style>{`
        @keyframes fangornFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fangornBlink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>

      <div style={{ display: "flex", gap: 0, margin: "0 auto 20px", border: "0.5px solid var(--color-border-secondary, #2a2a2a)", borderRadius: 10, overflow: "hidden", background: "var(--color-background-secondary, #0e0e0e)" }}>
        {["browse", "query"].map((m) => (
          <button key={m} onClick={() => switchMode(m)}
            style={{
              flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 500,
              background: mode === m ? "var(--color-background-primary, #141414)" : "transparent",
              border: "none", cursor: "pointer",
              color: mode === m ? "var(--color-text-primary, #fafafa)" : "var(--color-text-secondary, #8a8a8a)",
              borderRadius: mode === m ? 9 : 0,
              boxShadow: mode === m ? "0 0 0 0.5px var(--color-border-secondary, #2a2a2a)" : "none",
              transition: "background 0.15s, color 0.15s",
            }}>
            {m === "browse" ? "Browse schemas" : "Query data"}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--color-background-secondary, #0e0e0e)", borderRadius: 20, border: "0.5px solid var(--color-border-secondary, #2a2a2a)", padding: 24, margin: "0 auto" }}>
        {mode === "browse" ? (
          <BrowseFlow key={`browse-${key}`} schemas={schemas || []} initialDetail={schemaDetail} onQuerySchema={handleQuerySchema} />
        ) : (
          <QueryFlow key={`query-${key}`} manifestStates={dataEntries || []} schemaName={activeSchemaName || ""} autoLoad={autoLoad} sendPrompt={sendMessage} />
        )}
      </div>
    </div>
  );
}
