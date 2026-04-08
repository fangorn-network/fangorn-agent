import type { FileEntry, FileField } from "@fangorn-network/client-types";
import { Pill } from "../primitives";
import { BaseBlock, CardRenderContext } from "./BaseBlock";
import { BaseCard, ExpandChevron, ExpandedSection } from "../Cards/BaseCard";

interface FileEntriesBlockProps {
  entries: FileEntry[];
}

export const FileEntriesBlock = ({ entries }: FileEntriesBlockProps) => (
  <BaseBlock
    items={entries}
    pageSize={5}
    itemNoun="file entry"
    itemNounPlural="file entries"
    getKey={(file, i) => file.id || i}
    renderCard={(file: FileEntry, ctx: CardRenderContext) => {
      const allFields = file.fileFields ?? [];
      const plainFields = allFields.filter((f) => f.acc === "plain");
      const encFields = allFields.filter((f) => f.acc != null && f.acc !== "plain");

      return (
        <BaseCard isActive={ctx.isExpanded} onClick={ctx.toggleExpand}>
          {/* ── Summary row ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ maxWidth: "60%" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary, #fafafa)" }}>
                {plainFields[0]?.value ?? file.tag ?? `File ${ctx.globalIndex + 1}`}
              </div>
              {plainFields[1] && (
                <div style={{ fontSize: 11, color: "var(--color-text-secondary, #8a8a8a)", marginTop: 2 }}>
                  {plainFields[1].name ?? "—"}: {plainFields[1].value ?? "—"}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {encFields.length > 0 && <Pill variant="amber">🔒 {encFields.length}</Pill>}
              <Pill variant="blue">
                {allFields.length} field{allFields.length !== 1 ? "s" : ""}
              </Pill>
              <ExpandChevron isExpanded={ctx.isExpanded} />
            </div>
          </div>

          {/* ── Expanded field list ── */}
          {ctx.isExpanded && (
            <ExpandedSection>
              {allFields.map((f: FileField) => {
                const fName = f.name ?? "—";
                const fType = f.atType ?? "unknown";

                return (
                  <div
                    key={f.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "3px 0",
                      fontSize: 11,
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ color: "var(--color-text-secondary, #8a8a8a)" }}>{fName}</span>
                      <Pill type={fType}>{fType}</Pill>
                    </div>
                    <div style={{ textAlign: "right", maxWidth: "55%", wordBreak: "break-all" }}>
                      <span style={{ color: "var(--color-text-primary, #fafafa)", fontWeight: 500 }}>
                        {f.acc === "plain" ? (f.value ?? "—") : `[${f.acc ?? "unknown"}]`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </ExpandedSection>
          )}
        </BaseCard>
      );
    }}
  />
);