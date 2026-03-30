import { useState } from "react";
import { FileEntry, Field } from "../types/subgraph";
import { ACCENT, ACCENT_BG } from "@/constants";
import { Pill, EncryptedBadge, ActionBtn, truncAddr } from "./primitives";

interface DataRecordCardProps {
  index: number;
  file: FileEntry;
  plainFields: Field[];
  encFields: Field[];
  summaryField: Field | undefined;
  secondaryField: Field | undefined;
  totalEncPrice: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const DataRecordCard = ({
  index, file, plainFields, encFields, summaryField, secondaryField,
  totalEncPrice, isExpanded, onToggle,
}: DataRecordCardProps) => {
  const [hovered, setHovered] = useState(false);

  const handlePurchase = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: hook up purchase via sendPrompt
  };

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isExpanded ? ACCENT_BG : "var(--color-background-primary, #fff)",
        border: `0.5px solid ${isExpanded ? ACCENT : hovered ? "var(--color-border-primary, #aaa)" : "var(--color-border-tertiary, #e0e0e0)"}`,
        borderRadius: 12, padding: "10px 12px", cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ maxWidth: "60%" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary, #1a1a1a)" }}>
            {summaryField ? summaryField.value : `Record ${index + 1}`}
          </div>
          {secondaryField && (
            <div style={{ fontSize: 11, color: "var(--color-text-secondary, #666)", marginTop: 2 }}>
              {secondaryField.name}: {secondaryField.value}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {encFields.length > 0 && totalEncPrice > 0 && <Pill variant="green">${totalEncPrice.toFixed(2)}</Pill>}
          {encFields.length > 0 && <Pill variant="amber">🔒 {encFields.length}</Pill>}
          <span style={{
            fontSize: 11, color: "var(--color-text-tertiary, #999)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s", display: "inline-block",
          }}>▼</span>
        </div>
      </div>

      {isExpanded && (
        <div
          style={{ marginTop: 10, borderTop: "0.5px solid var(--color-border-tertiary, #e0e0e0)", paddingTop: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          {file.fields.map((f) => (
            <div key={f.name}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 12, gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ color: "var(--color-text-secondary, #666)" }}>{f.name}</span>
                  <Pill type={f.atType}>{f.atType}</Pill>
                </div>
                <div style={{ textAlign: "right", maxWidth: "55%", wordBreak: "break-all" }}>
                  {f.acc === "plain" ? (
                    <span style={{ color: "var(--color-text-primary, #1a1a1a)", fontWeight: 500 }}>{f.value}</span>
                  ) : (
                    <EncryptedBadge />
                  )}
                </div>
              </div>
              {f.acc !== "plain" && f.price != null && Number(f.price.price) > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0 4px 16px", fontSize: 11 }}>
                    <span style={{ color: "var(--color-text-tertiary, #999)" }}>price</span>
                    <Pill variant="green">${Number(f.price.price).toFixed(2)} USDC</Pill>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
                    source: {truncAddr(f.price.owner)}
                  </div>
                </div>
              )}
            </div>
          ))}
          {encFields.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: "0.5px solid var(--color-border-tertiary, #e0e0e0)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary, #666)" }}>
                {encFields.length} encrypted field{encFields.length !== 1 ? "s" : ""}
                {totalEncPrice > 0 && ` · $${totalEncPrice.toFixed(2)} total`}
              </div>
              <ActionBtn small onClick={handlePurchase}>Purchase access</ActionBtn>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
