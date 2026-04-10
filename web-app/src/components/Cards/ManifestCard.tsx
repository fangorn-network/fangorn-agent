import { useState } from "react";
import type { ManifestState, FileEntry, FileField } from "@fangorn-network/client-types";
import { Pill, EncryptedBadge, truncAddr } from "../primitives";
import {
  BaseCard,
  ExpandChevron,
  ExpandedSection,
} from "./BaseCard";
import { CardChatConfig } from "../Chat/Chat";

const MANIFEST_COLOR = "#a78bfa";
const FILE_COLOR = "#34d399";
const FILES_PER_PAGE = 5;

/* ═══════════════════════════════════════════════════════════
   FileEntryRow — nested card for files within a manifest

   FileEntry (FileFragment) nullable fields:
     - tag: string | null
     - fileFields: FileField[] | null
   FileField (FileFieldFragment) nullable fields:
     - name, value, atType, acc: string | null
     - pricing: PricingResource | null
   ═══════════════════════════════════════════════════════════ */

interface FileEntryRowProps {
  file: FileEntry;
  fileIndex: number;
  isSelected: boolean;
  onSelect: () => void;
}

const FileEntryRow = ({ file, fileIndex, isSelected, onSelect }: FileEntryRowProps) => {
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
			type:"file",
      tag: file.tag,
			manifestStateId: file.manifestStateId,
			schemaId: file.schemaId,
			schemaName: file.schemaName,
      fieldCount: allFields.length,
      fields: allFields.map((f) => ({
        name: f.name,
        value:f.value,
        type: f.atType,
				owner: f.pricing? f.pricing.owner : ""
      })),
    }),
  };

  return (
    <BaseCard
      isActive={isSelected}
      accentColor={FILE_COLOR}
      onClick={onSelect}
      onChatSent={() => onSelect()}
      chat={isSelected ? chat : undefined}
      borderRadius={10}
      padding="8px 10px"
      activeBg="rgba(255, 255, 255, 0.06)"
      inactiveBg="var(--color-background-secondary, #0e0e0e)"
    >
      {/* ── Summary row ── */}
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

      {/* ── Expanded field list ── */}
      {isSelected && (
        <div
          style={{
            marginTop: 8,
            borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
            paddingTop: 6,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {allFields.map((f) => {
            const fName = f.name ?? "—";
            const fType = f.atType ?? "unknown";
            const fAcc = f.acc;
            const isPlain = fAcc === "plain";

            return (
              <div key={f.id}>
                <div
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
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "2px 0 4px 16px",
                      fontSize: 10,
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

interface ManifestCardProps {
  index: number;
  manifestState: ManifestState;
  isExpanded: boolean;
  onToggle: () => void;
  selectedFileIndex: number | null;
  onFileSelect: (fileIndex: number | null) => void;
} 

export const ManifestCard = ({
  index,
  manifestState,
  isExpanded,
  onToggle,
  selectedFileIndex,
  onFileSelect,
}: ManifestCardProps) => {
  const [filePage, setFilePage] = useState(1);

  const files = manifestState.manifest?.files ?? [];
  const fileCount = files.length;
  const totalFilePages = Math.max(1, Math.ceil(fileCount / FILES_PER_PAGE));
  const filePageStart = (filePage - 1) * FILES_PER_PAGE;
  const visibleFiles = files.slice(filePageStart, filePageStart + FILES_PER_PAGE);

  const chat: CardChatConfig = {
    contextType: "manifest",
    contextLabel: `Re: ${manifestState.schemaName} (${truncAddr(manifestState.owner)})`,
    placeholder: "Ask about this manifest...",
    buildContext: () => ({
      id: manifestState.id,
			type: "manifest",
      owner: manifestState.owner,
      schemaName: manifestState.schemaName,
      schemaId: manifestState.schemaId,
    }),
  };

  return (
    <BaseCard
      isActive={isExpanded}
      accentColor={MANIFEST_COLOR}
      onClick={onToggle}
      onChatSent={() => onToggle()}
      chat={isExpanded ? chat : undefined}
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
            {manifestState.schemaName || `Manifest ${index + 1}`}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary, #5a5a5a)",
              marginTop: 3,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            owner: {truncAddr(manifestState.owner)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Pill variant="blue">
            {fileCount} file{fileCount !== 1 ? "s" : ""}
          </Pill>
          <ExpandChevron isExpanded={isExpanded} />
        </div>
      </div>

      {/* ── Subtitle ── */}
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", marginTop: 3 }}>
        {manifestState.version}
        {manifestState.manifestCid && (
          <span> · CID: {truncAddr(manifestState.manifestCid)}</span>
        )}
      </div>

      {/* ── Expanded file list ── */}
      {isExpanded && (
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
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {visibleFiles.map((file, i) => {
                  const globalFileIdx = filePageStart + i;
                  return (
                    <FileEntryRow
                      key={file.id || globalFileIdx}
                      file={file}
                      fileIndex={globalFileIdx}
                      isSelected={selectedFileIndex === globalFileIdx}
                      onSelect={() =>
                        onFileSelect(selectedFileIndex === globalFileIdx ? null : globalFileIdx)
                      }
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
                    onClick={() => {
                      setFilePage((p) => Math.max(1, p - 1));
                      onFileSelect(null);
                    }}
                    disabled={filePage <= 1}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: filePage <= 1 ? "default" : "pointer",
                      color:
                        filePage <= 1
                          ? "var(--color-text-tertiary, #5a5a5a)"
                          : "var(--color-text-primary, #fafafa)",
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "2px 6px",
                    }}
                  >
                    ‹
                  </button>
                  <span>
                    {filePage} / {totalFilePages}
                  </span>
                  <button
                    onClick={() => {
                      setFilePage((p) => Math.min(totalFilePages, p + 1));
                      onFileSelect(null);
                    }}
                    disabled={filePage >= totalFilePages}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: filePage >= totalFilePages ? "default" : "pointer",
                      color:
                        filePage >= totalFilePages
                          ? "var(--color-text-tertiary, #5a5a5a)"
                          : "var(--color-text-primary, #fafafa)",
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "2px 6px",
                    }}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </ExpandedSection>
      )}
    </BaseCard>
  );
};