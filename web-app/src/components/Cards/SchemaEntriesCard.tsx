import { useState } from "react";
import { Pill, truncAddr } from "../primitives";
import { useChatContext } from "../ChatContext";

const SCHEMA_COLOR = "#6e8efb";

interface SchemaField { id: string; name: string; fieldType: string; }
interface SchemaEntries { id: string; version: string; spec_cid: string; agent_id: string | null; fields: SchemaField[]; }
interface SchemaEntriesCardProps { entry: SchemaEntries; index: number; isExpanded: boolean; onToggle: () => void; }

export const SchemaEntriesCard = ({ entry, index, isExpanded, onToggle }: SchemaEntriesCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [hasSent, setHasSent] = useState(false);
  const { sendMessage } = useChatContext();
  const contextLabel = `Re: Schema v${entry.version}`;

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    const context = { id: entry.id, version: entry.version, spec_cid: entry.spec_cid, agent_id: entry.agent_id, fields: entry.fields.map((f) => `${f.name} (${f.fieldType})`) };
    sendMessage(`In regards to this Schema Entry ${JSON.stringify(context)}: ${chatInput}`, { contextLabel, contextType: "schema", displayMessage: chatInput });
    setChatInput("");
    setHasSent(true);
    onToggle(); // collapse
  };

  return (
    <div onClick={onToggle} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: isExpanded ? "rgba(255, 255, 255, 0.04)" : "var(--color-background-primary, #141414)",
        border: `0.5px solid ${isExpanded || hovered ? "var(--color-border-primary, #3a3a3a)" : "var(--color-border-tertiary, #1e1e1e)"}`,
        borderLeft: hasSent ? `3px solid ${SCHEMA_COLOR}` : undefined,
        borderRadius: 12, padding: "10px 12px", cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #fafafa)" }}>Version {entry.version}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>{truncAddr(entry.id)}</div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {hasSent && <span style={{ fontSize: 9, color: SCHEMA_COLOR, fontFamily: "var(--font-mono, monospace)" }}>● thread</span>}
          <Pill variant="blue">{entry.fields.length} field{entry.fields.length !== 1 ? "s" : ""}</Pill>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
        </div>
      </div>
      {isExpanded && (
        <div style={{ marginTop: 10, borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)", paddingTop: 8 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", marginBottom: 6, fontFamily: "var(--font-mono, monospace)" }}>
            spec: {truncAddr(entry.spec_cid)}{entry.agent_id && <span> · agent: {truncAddr(entry.agent_id)}</span>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {entry.fields.map((f) => (
              <div key={f.id || f.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "var(--color-background-secondary, #0e0e0e)", borderRadius: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary, #fafafa)" }}>{f.name}</span>
                <Pill type={f.fieldType}>{f.fieldType}</Pill>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", background: "var(--color-background-secondary, #0e0e0e)", border: "0.5px solid var(--color-border-tertiary, #1e1e1e)", borderRadius: 8, padding: 4 }}>
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()} placeholder="Ask about this version..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 12, padding: "5px 6px", background: "transparent", color: "var(--color-text-primary, #fafafa)", fontFamily: "var(--font-body, sans-serif)" }} />
              <button onClick={handleChatSubmit} disabled={!chatInput.trim()} style={{ border: "none", background: chatInput.trim() ? "var(--color-text-primary, #fafafa)" : "var(--color-border-tertiary, #1e1e1e)", color: chatInput.trim() ? "var(--color-background-primary, #141414)" : "var(--color-text-tertiary, #5a5a5a)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: chatInput.trim() ? "pointer" : "default", transition: "background 0.15s, color 0.15s", fontFamily: "var(--font-body, sans-serif)" }}>↵</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};