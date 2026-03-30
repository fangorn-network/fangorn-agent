import { useState } from "react";
import { Schema } from "../types/subgraph";
import { ACCENT, ACCENT_BG } from "../constants";
import { Pill, Card, FieldRow, truncAddr } from "./primitives";

interface SchemaCardProps {
  schema: Schema;
  fieldCount: number;
  selected: boolean;
  onSelect: () => void;
}

export const SchemaCard = ({ schema, fieldCount, selected, onSelect }: SchemaCardProps) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? ACCENT_BG : "var(--color-background-primary, #fff)",
        border: `0.5px solid ${selected ? ACCENT : hovered ? "var(--color-border-primary, #aaa)" : "var(--color-border-tertiary, #e0e0e0)"}`,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #1a1a1a)", fontFamily: "var(--font-mono, monospace)", maxWidth: "70%" }}>
          {schema.name}
        </div>
        <Pill variant="blue">{fieldCount} field{fieldCount !== 1 ? "s" : ""}</Pill>
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", marginTop: 4, fontFamily: "var(--font-mono, monospace)" }}>
        owner: {truncAddr(schema.owner)}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", marginTop: 2 }}>
        {schema.versions?.length || 0} version{(schema.versions?.length || 0) !== 1 ? "s" : ""}
        {schema.schemaId && <span> · ID: {truncAddr(schema.schemaId)}</span>}
      </div>
    </div>
  );
};

interface SchemaDetailCardProps {
  schema: Schema;
}

export const SchemaDetailCard = ({ schema }: SchemaDetailCardProps) => {
  const latestVersion = schema.versions?.[schema.versions.length - 1];
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
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary, #e0e0e0)", paddingTop: 8, marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary, #1a1a1a)", marginBottom: 8 }}>
            Fields (v{latestVersion.version})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {latestVersion.fields.map((f) => (
              <div
                key={f.name}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 10px",
                  background: "var(--color-background-secondary, #f5f5f5)",
                  borderRadius: 8, fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 500, color: "var(--color-text-primary, #1a1a1a)" }}>{f.name}</span>
                <Pill type={f.fieldType}>{f.fieldType}</Pill>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
