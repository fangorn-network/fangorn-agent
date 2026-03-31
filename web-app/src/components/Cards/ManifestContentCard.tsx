import { useState } from "react";
import { Manifest, FileEntry, Field } from "../../types/subgraph";
import { Pill, EncryptedBadge, truncAddr } from "../primitives";

/* ── File entry row (reused from ManifestCard pattern) ── */

interface FileRowProps {
  file: FileEntry;
  fileIndex: number;
  isSelected: boolean;
  onSelect: () => void;
}

const FileRow = ({ file, fileIndex, isSelected, onSelect }: FileRowProps) => {
  const [hovered, setHovered] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    console.log(`[ManifestContentCard FileRow #${fileIndex}] chat:`, chatInput);
    setChatInput("");
  };

  const plainFields = file.fields.filter((f) => f.acc === "plain");
  const encFields = file.fields.filter((f) => f.acc !== "plain");
  const summaryField = plainFields[0];
  const secondaryField = plainFields.length > 1 ? plainFields[1] : undefined;
  const totalEncPrice = encFields.reduce(
    (sum, f) => sum + (f.price != null ? Number(f.price.price) : 0),
    0
  );

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? "rgba(255, 255, 255, 0.06)" : "var(--color-background-secondary, #0e0e0e)",
        border: `0.5px solid ${isSelected || hovered ? "var(--color-border-primary, #3a3a3a)" : "var(--color-border-tertiary, #1e1e1e)"}`,
        borderRadius: 10, padding: "8px 10px", cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ maxWidth: "60%" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary, #fafafa)" }}>
            {summaryField ? summaryField.value : `File ${fileIndex + 1}`}
          </div>
          {secondaryField && (
            <div style={{ fontSize: 11, color: "var(--color-text-secondary, #8a8a8a)", marginTop: 1 }}>
              {secondaryField.name}: {secondaryField.value}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {encFields.length > 0 && totalEncPrice > 0 && <Pill variant="green">${totalEncPrice.toFixed(2)}</Pill>}
          {encFields.length > 0 && <Pill variant="amber">🔒 {encFields.length}</Pill>}
          <span style={{
            fontSize: 10, color: "var(--color-text-tertiary, #5a5a5a)",
            transform: isSelected ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s", display: "inline-block",
          }}>▼</span>
        </div>
      </div>

      {isSelected && (
        <div
          style={{ marginTop: 8, borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)", paddingTop: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          {file.fields.map((f) => (
            <div key={f.id || f.name}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 11, gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ color: "var(--color-text-secondary, #8a8a8a)" }}>{f.name}</span>
                  <Pill type={f.atType}>{f.atType}</Pill>
                </div>
                <div style={{ textAlign: "right", maxWidth: "55%", wordBreak: "break-all" }}>
                  {f.acc === "plain"
                    ? <span style={{ color: "var(--color-text-primary, #fafafa)", fontWeight: 500 }}>{f.value}</span>
                    : <EncryptedBadge />}
                </div>
              </div>
              {f.acc !== "plain" && f.price != null && Number(f.price.price) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0 4px 16px", fontSize: 10 }}>
                  <span style={{ color: "var(--color-text-tertiary, #5a5a5a)" }}>price</span>
                  <Pill variant="green">${Number(f.price.price).toFixed(2)} USDC</Pill>
                </div>
              )}
            </div>
          ))}

          {/* File-level chat */}
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)" }}>
            <div style={{
              display: "flex", gap: 6, alignItems: "center",
              background: "var(--color-background-primary, #141414)",
              border: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
              borderRadius: 7, padding: 3,
            }}>
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                placeholder="Ask about this file..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 11, padding: "4px 6px", background: "transparent", color: "var(--color-text-primary, #fafafa)", fontFamily: "var(--font-body, sans-serif)" }}
              />
              <button onClick={handleChatSubmit} disabled={!chatInput.trim()}
                style={{
                  border: "none", background: chatInput.trim() ? "var(--color-text-primary, #fafafa)" : "var(--color-border-tertiary, #1e1e1e)",
                  color: chatInput.trim() ? "var(--color-background-primary, #141414)" : "var(--color-text-tertiary, #5a5a5a)",
                  borderRadius: 5, padding: "3px 8px", fontSize: 10, fontWeight: 600,
                  cursor: chatInput.trim() ? "pointer" : "default", transition: "background 0.15s, color 0.15s", fontFamily: "var(--font-body, sans-serif)",
                }}>↵</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── ManifestContentCard ── */

interface ManifestContentCardProps {
  manifest: Manifest;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const FILES_PER_PAGE = 5;

export const ManifestContentCard = ({
  manifest,
  index,
  isExpanded,
  onToggle,
}: ManifestContentCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [filePage, setFilePage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    console.log(`[ManifestContentCard #${index}] chat:`, chatInput);
    setChatInput("");
  };

  const files = manifest.files || [];
  const fileCount = files.length;
  const totalFilePages = Math.max(1, Math.ceil(fileCount / FILES_PER_PAGE));
  const filePageStart = (filePage - 1) * FILES_PER_PAGE;
  const visibleFiles = files.slice(filePageStart, filePageStart + FILES_PER_PAGE);

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isExpanded ? "rgba(255, 255, 255, 0.04)" : "var(--color-background-primary, #141414)",
        border: `0.5px solid ${isExpanded || hovered ? "var(--color-border-primary, #3a3a3a)" : "var(--color-border-tertiary, #1e1e1e)"}`,
        borderRadius: 12, padding: "10px 12px", cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ maxWidth: "65%" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #fafafa)", fontFamily: "var(--font-mono, monospace)" }}>
            Manifest {index + 1}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>
            {truncAddr(manifest.id)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Pill variant="blue">{fileCount} file{fileCount !== 1 ? "s" : ""}</Pill>
          <span style={{
            fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s", display: "inline-block",
          }}>▼</span>
        </div>
      </div>

      {/* Metadata */}
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", marginTop: 3 }}>
        {manifest.manifestVersion && <span>v{manifest.manifestVersion}</span>}
        {manifest.schemaId && <span> · schema: {truncAddr(manifest.schemaId)}</span>}
      </div>

      {/* Expanded */}
      {isExpanded && (
        <div
          style={{ marginTop: 10, borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)", paddingTop: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary, #fafafa)", marginBottom: 6 }}>
            File Entries
          </div>

          {fileCount === 0 ? (
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary, #5a5a5a)" }}>No files in this manifest.</div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {visibleFiles.map((file, i) => {
                  const globalIdx = filePageStart + i;
                  return (
                    <FileRow
                      key={file.id || globalIdx}
                      file={file}
                      fileIndex={globalIdx}
                      isSelected={selectedFile === globalIdx}
                      onSelect={() => setSelectedFile(selectedFile === globalIdx ? null : globalIdx)}
                    />
                  );
                })}
              </div>
              {totalFilePages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11, color: "var(--color-text-secondary, #8a8a8a)" }}>
                  <button onClick={() => { setFilePage((p) => Math.max(1, p - 1)); setSelectedFile(null); }} disabled={filePage <= 1}
                    style={{ border: "none", background: "none", cursor: filePage <= 1 ? "default" : "pointer", color: filePage <= 1 ? "var(--color-text-tertiary, #5a5a5a)" : "var(--color-text-primary, #fafafa)", fontSize: 13, fontWeight: 600, padding: "2px 6px" }}>‹</button>
                  <span>{filePage} / {totalFilePages}</span>
                  <button onClick={() => { setFilePage((p) => Math.min(totalFilePages, p + 1)); setSelectedFile(null); }} disabled={filePage >= totalFilePages}
                    style={{ border: "none", background: "none", cursor: filePage >= totalFilePages ? "default" : "pointer", color: filePage >= totalFilePages ? "var(--color-text-tertiary, #5a5a5a)" : "var(--color-text-primary, #fafafa)", fontSize: 13, fontWeight: 600, padding: "2px 6px" }}>›</button>
                </div>
              )}
            </>
          )}

          {/* Manifest-level chat */}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)" }}>
            <div style={{
              display: "flex", gap: 6, alignItems: "center",
              background: "var(--color-background-secondary, #0e0e0e)",
              border: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
              borderRadius: 8, padding: 4,
            }}>
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                placeholder="Ask about this manifest..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 12, padding: "5px 6px", background: "transparent", color: "var(--color-text-primary, #fafafa)", fontFamily: "var(--font-body, sans-serif)" }}
              />
              <button onClick={handleChatSubmit} disabled={!chatInput.trim()}
                style={{
                  border: "none", background: chatInput.trim() ? "var(--color-text-primary, #fafafa)" : "var(--color-border-tertiary, #1e1e1e)",
                  color: chatInput.trim() ? "var(--color-background-primary, #141414)" : "var(--color-text-tertiary, #5a5a5a)",
                  borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600,
                  cursor: chatInput.trim() ? "pointer" : "default", transition: "background 0.15s, color 0.15s", fontFamily: "var(--font-body, sans-serif)",
                }}>↵</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};