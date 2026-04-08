import { useState } from "react";
import type { Manifest, FileEntry, FileField } from "@fangorn-network/client-types";
import { Pill, EncryptedBadge, truncAddr } from "../primitives";
import { BaseBlock, CardRenderContext } from "./BaseBlock";
import {
  BaseCard,
  CardChatConfig,
  ExpandChevron,
  ExpandedSection,
} from "../Cards/BaseCard";

const MANIFEST_COLOR = "#a78bfa";
const FILE_COLOR = "#34d399";
const FILES_PER_PAGE = 5;

/* ═══════════════════════════════════════════════════════════
   ManifestsBlock — for raw Manifest objects (ManifestFragment)

   Manifest nullable fields:
     - manifestVersion: string | null
     - schemaId: string | null
     - files: File[] | null

   Use ManifestStatesBlock instead when you have ManifestState[].
   ═══════════════════════════════════════════════════════════ */

interface ManifestsBlockProps {
  manifests: Manifest[];
}

export const ManifestsBlock = ({ manifests }: ManifestsBlockProps) => {
  const [selectedFiles, setSelectedFiles] = useState<Record<number, number | null>>({});

  return (
    <BaseBlock
      items={manifests}
      pageSize={5}
      itemNoun="manifest"
      getKey={(m, i) => m.id || i}
      onPageChange={() => setSelectedFiles({})}
      renderCard={(manifest: Manifest, ctx: CardRenderContext) => {
        const files = manifest.files ?? [];
        const fileCount = files.length;
        const selectedFileIndex = selectedFiles[ctx.globalIndex] ?? null;

        const chat: CardChatConfig = {
          contextType: "manifest",
          contextLabel: `Re: Manifest ${truncAddr(manifest.id)}`,
          placeholder: "Ask about this manifest...",
          buildContext: () => ({
            id: manifest.id,
            manifestVersion: manifest.manifestVersion,
            schemaId: manifest.schemaId,
            fileCount,
          }),
        };

        return (
          <BaseCard
            isActive={ctx.isExpanded}
            accentColor={MANIFEST_COLOR}
            onClick={ctx.toggleExpand}
            onChatSent={ctx.toggleExpand}
            chat={ctx.isExpanded ? chat : undefined}
          >
            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ maxWidth: "65%" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-text-primary, #fafafa)",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  Manifest {ctx.globalIndex + 1}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-tertiary, #5a5a5a)",
                    marginTop: 2,
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {truncAddr(manifest.id)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <Pill variant="blue">
                  {fileCount} file{fileCount !== 1 ? "s" : ""}
                </Pill>
                <ExpandChevron isExpanded={ctx.isExpanded} />
              </div>
            </div>

            {/* ── Subtitle ── */}
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", marginTop: 3 }}>
              {manifest.manifestVersion && <span>v{manifest.manifestVersion}</span>}
              {manifest.schemaId && <span> · schema: {truncAddr(manifest.schemaId)}</span>}
            </div>

            {/* ── Expanded file list ── */}
            {ctx.isExpanded && (
              <ExpandedSection>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-text-primary, #fafafa)",
                    marginBottom: 6,
                  }}
                >
                  File Entries
                </div>

                {fileCount === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--color-text-tertiary, #5a5a5a)" }}>
                    No files in this manifest.
                  </div>
                ) : (
                  <ManifestFileList
                    files={files}
                    selectedFileIndex={selectedFileIndex}
                    onFileSelect={(fi) =>
                      setSelectedFiles((prev) => ({ ...prev, [ctx.globalIndex]: fi }))
                    }
                  />
                )}
              </ExpandedSection>
            )}
          </BaseCard>
        );
      }}
    />
  );
};

/* ═══════════════════════════════════════════════════════════
   ManifestFileList — paginated file rows inside a manifest
   ═══════════════════════════════════════════════════════════ */

const ManifestFileList = ({
  files,
  selectedFileIndex,
  onFileSelect,
}: {
  files: FileEntry[];
  selectedFileIndex: number | null;
  onFileSelect: (index: number | null) => void;
}) => {
  const [filePage, setFilePage] = useState(1);
  const totalFilePages = Math.max(1, Math.ceil(files.length / FILES_PER_PAGE));
  const pageStart = (filePage - 1) * FILES_PER_PAGE;
  const visibleFiles = files.slice(pageStart, pageStart + FILES_PER_PAGE);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visibleFiles.map((file, i) => {
          const globalIdx = pageStart + i;
          return (
            <ManifestFileRow
              key={file.id || globalIdx}
              file={file}
              fileIndex={globalIdx}
              isSelected={selectedFileIndex === globalIdx}
              onSelect={() => onFileSelect(selectedFileIndex === globalIdx ? null : globalIdx)}
            />
          );
        })}
      </div>
      {totalFilePages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
            fontSize: 11,
            color: "var(--color-text-secondary, #8a8a8a)",
          }}
        >
          <button
            onClick={() => { setFilePage((p) => Math.max(1, p - 1)); onFileSelect(null); }}
            disabled={filePage <= 1}
            style={{
              border: "none", background: "none",
              cursor: filePage <= 1 ? "default" : "pointer",
              color: filePage <= 1 ? "var(--color-text-tertiary, #5a5a5a)" : "var(--color-text-primary, #fafafa)",
              fontSize: 13, fontWeight: 600, padding: "2px 6px",
            }}
          >
            ‹
          </button>
          <span>{filePage} / {totalFilePages}</span>
          <button
            onClick={() => { setFilePage((p) => Math.min(totalFilePages, p + 1)); onFileSelect(null); }}
            disabled={filePage >= totalFilePages}
            style={{
              border: "none", background: "none",
              cursor: filePage >= totalFilePages ? "default" : "pointer",
              color: filePage >= totalFilePages ? "var(--color-text-tertiary, #5a5a5a)" : "var(--color-text-primary, #fafafa)",
              fontSize: 13, fontWeight: 600, padding: "2px 6px",
            }}
          >
            ›
          </button>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   ManifestFileRow — single file entry within a manifest
   ═══════════════════════════════════════════════════════════ */

const ManifestFileRow = ({
  file,
  fileIndex,
  isSelected,
  onSelect,
}: {
  file: FileEntry;
  fileIndex: number;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const allFields = file.fileFields ?? [];
  const plainFields = allFields.filter((f) => f.acc === "plain");
  const encFields = allFields.filter((f) => f.acc != null && f.acc !== "plain");
  const summaryField = plainFields[0];
  const secondaryField = plainFields.length > 1 ? plainFields[1] : undefined;
  const totalEncPrice = encFields.reduce(
    (sum, f) => sum + (f.pricing != null ? Number(f.pricing.price) : 0),
    0
  );

  const chat: CardChatConfig = {
    contextType: "file",
    contextLabel: `Re: File ${file.tag ?? file.id}`,
    placeholder: "Ask about this file...",
    buildContext: () => ({
      id: file.id,
      tag: file.tag,
      fieldCount: allFields.length,
      fields: allFields.map((f) => ({
        name: f.name,
        value: f.acc === "plain" ? f.value : `[${f.acc ?? "unknown"}]`,
        type: f.atType,
        hasPrice: f.pricing != null && Number(f.pricing.price) > 0,
      })),
    }),
  };

  return (
    <BaseCard
      isActive={isSelected}
      accentColor={FILE_COLOR}
      onClick={onSelect}
      onChatSent={onSelect}
      chat={isSelected ? chat : undefined}
      borderRadius={10}
      padding="8px 10px"
      activeBg="rgba(255, 255, 255, 0.06)"
      inactiveBg="var(--color-background-secondary, #0e0e0e)"
    >
      {/* ── Summary ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ maxWidth: "60%" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary, #fafafa)" }}>
            {summaryField?.value ?? file.tag ?? `File ${fileIndex + 1}`}
          </div>
          {secondaryField && (
            <div style={{ fontSize: 11, color: "var(--color-text-secondary, #8a8a8a)", marginTop: 1 }}>
              {secondaryField.name ?? "—"}: {secondaryField.value ?? "—"}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {encFields.length > 0 && totalEncPrice > 0 && (
            <Pill variant="green">${totalEncPrice.toFixed(2)}</Pill>
          )}
          {encFields.length > 0 && <Pill variant="amber">🔒 {encFields.length}</Pill>}
          <ExpandChevron isExpanded={isSelected} size={10} />
        </div>
      </div>

      {/* ── Expanded fields ── */}
      {isSelected && (
        <div
          style={{ marginTop: 8, borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)", paddingTop: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          {allFields.map((f) => {
            const fName = f.name ?? "—";
            const fType = f.atType ?? "unknown";
            const isPlain = f.acc === "plain";

            return (
              <div key={f.id}>
                <div
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "3px 0", fontSize: 11, gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ color: "var(--color-text-secondary, #8a8a8a)" }}>{fName}</span>
                    <Pill type={fType}>{fType}</Pill>
                  </div>
                  <div style={{ textAlign: "right", maxWidth: "55%", wordBreak: "break-all" }}>
                    {isPlain ? (
                      <span style={{ color: "var(--color-text-primary, #fafafa)", fontWeight: 500 }}>
                        {f.value ?? "—"}
                      </span>
                    ) : (
                      <EncryptedBadge />
                    )}
                  </div>
                </div>
                {!isPlain && f.pricing != null && Number(f.pricing.price) > 0 && (
                  <div
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "2px 0 4px 16px", fontSize: 10,
                    }}
                  >
                    <span style={{ color: "var(--color-text-tertiary, #5a5a5a)" }}>price</span>
                    <Pill variant="green">${Number(f.pricing.price).toFixed(2)} USDC</Pill>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </BaseCard>
  );
};