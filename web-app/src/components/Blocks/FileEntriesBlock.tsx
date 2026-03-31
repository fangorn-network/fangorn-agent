import { useState } from "react";
import { FileEntry } from "../../types/subgraph";
import { Bubble, Pagination, Pill } from "../primitives";

const ITEMS_PER_PAGE = 5;

interface FileEntriesBlockProps {
  entries: FileEntry[];
}

export const FileEntriesBlock = ({ entries }: FileEntriesBlockProps) => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / ITEMS_PER_PAGE));
  const pageStart = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = entries.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fangornFadeIn 0.3s ease-out" }}>
      <Bubble role="system">
        Found {entries.length} file entr{entries.length !== 1 ? "ies" : "y"}
        {totalPages > 1 && <> — page {page} of {totalPages}</>}:
      </Bubble>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, width: "100%" }}>
        {pageItems.map((file, i) => {
          const globalIdx = pageStart + i;
          const plainFields = file.fields.filter((f) => f.acc === "plain");
          const encFields = file.fields.filter((f) => f.acc !== "plain");
          const isExpanded = expanded === globalIdx;

          return (
            <div
              key={file.id || globalIdx}
              onClick={() => setExpanded(isExpanded ? null : globalIdx)}
              style={{
                background: isExpanded ? "rgba(255, 255, 255, 0.04)" : "var(--color-background-primary, #141414)",
                border: `0.5px solid ${isExpanded ? "var(--color-border-primary, #3a3a3a)" : "var(--color-border-tertiary, #1e1e1e)"}`,
                borderRadius: 12, padding: "10px 12px", cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ maxWidth: "60%" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary, #fafafa)" }}>
                    {plainFields[0]?.value || file.tag || `File ${globalIdx + 1}`}
                  </div>
                  {plainFields[1] && (
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary, #8a8a8a)", marginTop: 2 }}>
                      {plainFields[1].name}: {plainFields[1].value}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {encFields.length > 0 && <Pill variant="amber">🔒 {encFields.length}</Pill>}
                  <Pill variant="blue">{file.fields.length} field{file.fields.length !== 1 ? "s" : ""}</Pill>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 10, borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)", paddingTop: 8 }}
                  onClick={(e) => e.stopPropagation()}>
                  {file.fields.map((f) => (
                    <div key={f.id || f.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 11, gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span style={{ color: "var(--color-text-secondary, #8a8a8a)" }}>{f.name}</span>
                        <Pill type={f.atType}>{f.atType}</Pill>
                      </div>
                      <div style={{ textAlign: "right", maxWidth: "55%", wordBreak: "break-all" }}>
                        <span style={{ color: "var(--color-text-primary, #fafafa)", fontWeight: 500 }}>
                          {f.acc === "plain" ? f.value : `[${f.acc}]`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages}
          onPageChange={(p) => { setPage(p); setExpanded(null); }} />
      )}
    </div>
  );
};