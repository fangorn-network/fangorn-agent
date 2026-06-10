"use client";

import { useModels } from "@/hooks/useModels";

interface ModelSelectorProps {
  /** Disable switching while the agent is mid-response */
  busy?: boolean;
}

export default function ModelSelector({ busy }: ModelSelectorProps) {
  const { models, current, switching, loading, error, switchModel } =
    useModels();

  if (loading) {
    return (
      <span
        style={{
          fontSize: 11,
          color: "var(--color-text-tertiary, #5a5a5a)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        loading models…
      </span>
    );
  }

  if (error || models.length === 0) {
    return (
      <span
        style={{
          fontSize: 11,
          color: "#e8b84a",
          fontFamily: "var(--font-mono, monospace)",
        }}
        title="Could not list models from Ollama"
      >
        {current ?? "no models"}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontSize: 10,
          color: "var(--color-text-tertiary, #5a5a5a)",
          fontFamily: "var(--font-mono, monospace)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        model
      </span>
      <select
        value={current ?? ""}
        onChange={(e) => switchModel(e.target.value)}
        disabled={switching || busy}
        style={{
          background: "var(--color-background-primary, #141414)",
          color: "var(--color-text-primary, #fafafa)",
          border: "0.5px solid var(--color-border-secondary, #2a2a2a)",
          borderRadius: 8,
          padding: "5px 8px",
          fontSize: 12,
          fontFamily: "var(--font-mono, monospace)",
          cursor: switching || busy ? "wait" : "pointer",
          outline: "none",
          opacity: switching || busy ? 0.6 : 1,
        }}
      >
        {models.map((m) => (
          <option key={m.name} value={m.name}>
            {m.name}
            {m.parameterSize ? ` (${m.parameterSize})` : ""}
          </option>
        ))}
      </select>
      {switching && (
        <span
          style={{
            fontSize: 10,
            color: "var(--color-text-tertiary, #5a5a5a)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          switching…
        </span>
      )}
    </div>
  );
}
