import { useState } from "react";
import { Field } from "../../types/subgraph";
import { Pill, EncryptedBadge, truncAddr } from "../primitives";

interface FieldCardProps {
  field: Field;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const FieldCard = ({
  field,
  index,
  isExpanded,
  onToggle,
}: FieldCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    console.log(`[FieldCard #${index} "${field.name}"] chat:`, chatInput);
    setChatInput("");
  };

  const isEncrypted = field.acc !== "plain";
  const hasPrice = field.price != null && Number(field.price.price) > 0;

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isExpanded
          ? "rgba(255, 255, 255, 0.04)"
          : "var(--color-background-primary, #141414)",
        border: `0.5px solid ${
          isExpanded || hovered
            ? "var(--color-border-primary, #3a3a3a)"
            : "var(--color-border-tertiary, #1e1e1e)"
        }`,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ maxWidth: "55%" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-primary, #fafafa)",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {field.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary, #8a8a8a)", marginTop: 2, wordBreak: "break-all" }}>
            {isEncrypted ? <EncryptedBadge /> : field.value}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Pill type={field.atType}>{field.atType}</Pill>
          {isEncrypted && <Pill variant="amber">🔒</Pill>}
          {hasPrice && <Pill variant="green">${Number(field.price!.price).toFixed(2)}</Pill>}
          <span
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary, #5a5a5a)",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s",
              display: "inline-block",
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div
          style={{
            marginTop: 10,
            borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
            paddingTop: 8,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <DetailRow label="ID" value={truncAddr(field.id)} mono />
            <DetailRow label="Type" value={field.atType} />
            <DetailRow label="Access" value={field.acc} />
            <DetailRow label="ManifestState" value={truncAddr(field.manifestState.id)} mono />
            {field.fileEntry && (
              <DetailRow label="FileEntry" value={truncAddr(field.fileEntry.id)} mono />
            )}
            {field.price && (
              <>
                <DetailRow label="Price" value={`${field.price.price} ${field.price.currency}`} />
                <DetailRow label="Price owner" value={truncAddr(field.price.owner)} mono />
              </>
            )}
          </div>

          {/* Inline chat */}
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)" }}>
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                background: "var(--color-background-secondary, #0e0e0e)",
                border: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
                borderRadius: 8,
                padding: 4,
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                placeholder="Ask about this field..."
                style={{
                  flex: 1, border: "none", outline: "none", fontSize: 12,
                  padding: "5px 6px", background: "transparent",
                  color: "var(--color-text-primary, #fafafa)",
                  fontFamily: "var(--font-body, sans-serif)",
                }}
              />
              <button
                onClick={handleChatSubmit}
                disabled={!chatInput.trim()}
                style={{
                  border: "none",
                  background: chatInput.trim() ? "var(--color-text-primary, #fafafa)" : "var(--color-border-tertiary, #1e1e1e)",
                  color: chatInput.trim() ? "var(--color-background-primary, #141414)" : "var(--color-text-tertiary, #5a5a5a)",
                  borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600,
                  cursor: chatInput.trim() ? "pointer" : "default",
                  transition: "background 0.15s, color 0.15s",
                  fontFamily: "var(--font-body, sans-serif)",
                }}
              >
                ↵
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Detail row helper ── */

const DetailRow = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0", fontSize: 11, gap: 8 }}>
    <span style={{ color: "var(--color-text-secondary, #8a8a8a)", flexShrink: 0 }}>{label}</span>
    <span
      style={{
        color: "var(--color-text-primary, #fafafa)",
        fontWeight: 500,
        fontFamily: mono ? "var(--font-mono, monospace)" : "inherit",
        textAlign: "right",
        wordBreak: "break-all",
      }}
    >
      {value}
    </span>
  </div>
);