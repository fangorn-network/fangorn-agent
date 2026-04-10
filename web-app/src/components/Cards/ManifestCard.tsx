import { useState } from "react";
import type { ManifestState, FileEntry } from "@fangorn-network/client-types";
import { Pill, EncryptedBadge, truncAddr } from "../primitives";
import {
  BaseCard,
  ExpandChevron,
  ExpandedSection,
} from "./BaseCard";
import { CardChatConfig } from "../Chat/Chat";
import { FileEntryRow } from "./FileEntryCard";

const MANIFEST_COLOR = "#a78bfa";
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