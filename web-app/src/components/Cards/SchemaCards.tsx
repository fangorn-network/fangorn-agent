import { useState } from "react";
import { Schema } from "../../types/subgraph";
import { Pill, Card, FieldRow, truncAddr } from "../primitives";
import { useChatContext } from "../ChatContext";

const SCHEMA_COLOR = "#6e8efb";

interface SchemaCardProps {
  schema: Schema;
  fieldCount: number;
  selected: boolean;
  hasSent?: boolean;
  onSelect: () => void;
}

export const SchemaCard = ({ schema, fieldCount, selected, hasSent = false, onSelect }: SchemaCardProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? "rgba(255, 255, 255, 0.04)" : "var(--color-background-primary, #141414)",
        border: `0.5px solid ${selected || hovered ? "var(--color-border-primary, #3a3a3a)" : "var(--color-border-tertiary, #1e1e1e)"}`,
        borderLeft: hasSent ? `3px solid ${SCHEMA_COLOR}` : undefined,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #fafafa)", fontFamily: "var(--font-mono, monospace)", maxWidth: "70%" }}>
          {schema.name}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {hasSent && (
            <span style={{ fontSize: 9, color: SCHEMA_COLOR, fontFamily: "var(--font-mono, monospace)" }}>
              ● thread
            </span>
          )}
          <Pill variant="blue">{fieldCount} field{fieldCount !== 1 ? "s" : ""}</Pill>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", marginTop: 4, fontFamily: "var(--font-mono, monospace)" }}>
        owner: {truncAddr(schema.owner)}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", marginTop: 2 }}>
        {schema.versions?.length || 0} version{(schema.versions?.length || 0) !== 1 ? "s" : ""}
        {schema.schemaId && <span> · ID: {truncAddr(schema.schemaId)}</span>}
      </div>
    </div>
  );
};

interface SchemaDetailCardProps {
  schema: Schema;
  onChatSent?: () => void;
}

export const SchemaDetailCard = ({ schema, onChatSent }: SchemaDetailCardProps) => {
  const [chatInput, setChatInput] = useState("");
  const { sendMessage } = useChatContext();
  const latestVersion = schema.versions?.[schema.versions.length - 1];
  const contextLabel = `Re: ${schema.name}`;

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    const context = {
      name: schema.name,
      schemaId: schema.schemaId,
      owner: schema.owner,
      versionCount: schema.versions?.length || 0,
      latestFields: latestVersion?.fields?.map((f) => `${f.name} (${f.fieldType})`) || [],
    };
    sendMessage(
      `In regards to the Schema ${JSON.stringify(context)}: ${chatInput}`,
      { contextLabel, contextType: "schema", displayMessage: chatInput }
    );
    setChatInput("");
    onChatSent?.();
  };

  return (
    <Card title="Schema Details">
      <FieldRow label="Name" value={schema.name} mono />
      <FieldRow label="Schema ID" value={truncAddr(schema.schemaId)} mono />
      <FieldRow label="Owner" value={truncAddr(schema.owner)} mono />
      <FieldRow label="Versions" value={schema.versions?.length || 0} />
      {latestVersion?.spec_cid && (
        <FieldRow label="Spec CID" value={truncAddr(latestVersion.spec_cid)} mono />
      )}
      {latestVersion?.fields && (
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)", paddingTop: 8, marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary, #fafafa)", marginBottom: 8 }}>
            Fields (v{latestVersion.version})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {latestVersion.fields.map((f) => (
              <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "var(--color-background-secondary, #0e0e0e)", borderRadius: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary, #fafafa)" }}>{f.name}</span>
                <Pill type={f.fieldType}>{f.fieldType}</Pill>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", background: "var(--color-background-secondary, #0e0e0e)", border: "0.5px solid var(--color-border-tertiary, #1e1e1e)", borderRadius: 8, padding: 4 }}>
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()} placeholder="Ask about this schema..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 12, padding: "5px 6px", background: "transparent", color: "var(--color-text-primary, #fafafa)", fontFamily: "var(--font-body, sans-serif)" }} />
          <button onClick={handleChatSubmit} disabled={!chatInput.trim()}
            style={{ border: "none", background: chatInput.trim() ? "var(--color-text-primary, #fafafa)" : "var(--color-border-tertiary, #1e1e1e)", color: chatInput.trim() ? "var(--color-background-primary, #141414)" : "var(--color-text-tertiary, #5a5a5a)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: chatInput.trim() ? "pointer" : "default", transition: "background 0.15s, color 0.15s", fontFamily: "var(--font-body, sans-serif)" }}>↵</button>
        </div>
      </div>
    </Card>
  );
};