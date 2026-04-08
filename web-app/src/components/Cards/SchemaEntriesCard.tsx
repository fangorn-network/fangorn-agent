import type { Schema, SchemaField } from "@fangorn-network/client-types";
import { Pill, truncAddr } from "../primitives";
import {
  BaseCard,
  CardChatConfig,
  ThreadIndicator,
  ExpandChevron,
  ExpandedSection,
} from "./BaseCard";

const SCHEMA_COLOR = "#6e8efb";

/* ═══════════════════════════════════════════════════════════
   SchemaEntriesCard
   (previously used a local "SchemaEntries" interface,
    now uses Schema which is the SchemaFragment type)

   Nullable fields to guard:
     - entry.version: string | null
     - entry.agentId: string | null  (was agent_id)
     - entry.fields: SchemaField[] | null | undefined
   Non-nullable (safe to access directly):
     - entry.id: string
     - SchemaField.id, .name, .fieldType: all string
   Removed:
     - spec_cid: not present on SchemaFragment
   ═══════════════════════════════════════════════════════════ */

interface SchemaEntriesCardProps {
  entry: Schema;
  index: number;
  isExpanded: boolean;
  hasSent?: boolean;
  onToggle: () => void;
  onChatSent?: () => void;
}

export const SchemaEntriesCard = ({
  entry,
  index,
  isExpanded,
  hasSent,
  onToggle,
  onChatSent,
}: SchemaEntriesCardProps) => {
  const fields = entry.fields ?? [];
  const versionLabel = entry.version ?? "unknown";

  const chat: CardChatConfig = {
    contextType: "schema version",
    contextLabel: `Re: Schema v${versionLabel}`,
    placeholder: "Ask about this version...",
    buildContext: () => ({
      id: entry.id,
      version: entry.version,
      agentId: entry.agentId,
      fields: fields.map((f) => `${f.name} (${f.fieldType})`),
    }),
  };

  return (
    <BaseCard
      isActive={isExpanded}
      hasSent={hasSent}
      accentColor={SCHEMA_COLOR}
      onClick={onToggle}
      onChatSent={() => {
        onToggle();
        onChatSent?.();
      }}
      chat={isExpanded ? chat : undefined}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #fafafa)" }}>
            Version {versionLabel}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary, #5a5a5a)",
              marginTop: 2,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {truncAddr(entry.id)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {hasSent && <ThreadIndicator color={SCHEMA_COLOR} />}
          <Pill variant="blue">
            {fields.length} field{fields.length !== 1 ? "s" : ""}
          </Pill>
          <ExpandChevron isExpanded={isExpanded} />
        </div>
      </div>

      {/* ── Expanded ── */}
      {isExpanded && (
        <ExpandedSection>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary, #5a5a5a)",
              marginBottom: 6,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {entry.agentId && <span>agent: {truncAddr(entry.agentId)}</span>}
          </div>
          {fields.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {fields.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    background: "var(--color-background-secondary, #0e0e0e)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary, #fafafa)" }}>
                    {f.name}
                  </span>
                  <Pill type={f.fieldType}>{f.fieldType}</Pill>
                </div>
              ))}
            </div>
          )}
        </ExpandedSection>
      )}
    </BaseCard>
  );
};