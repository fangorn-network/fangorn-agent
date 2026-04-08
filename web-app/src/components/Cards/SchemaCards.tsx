import type { SchemaState, Schema } from "@fangorn-network/client-types";
import { Pill, Card, FieldRow, truncAddr } from "../primitives";
import {
  BaseCard,
  CardChatConfig,
  ThreadIndicator,
} from "./BaseCard";

const SCHEMA_COLOR = "#6e8efb";

/* ═══════════════════════════════════════════════════════════
   SchemaCard — list-level summary card
   (previously used old "Schema" type, now uses SchemaState)
   ═══════════════════════════════════════════════════════════ */

interface SchemaCardProps {
  schema: SchemaState;
  fieldCount: number;
  selected: boolean;
  hasSent?: boolean;
  onSelect: () => void;
}

export const SchemaCard = ({
  schema,
  fieldCount,
  selected,
  hasSent = false,
  onSelect,
}: SchemaCardProps) => {
  const versionCount = schema.versions?.length ?? 0;

  return (
    <BaseCard
      isActive={selected}
      hasSent={hasSent}
      accentColor={SCHEMA_COLOR}
      onClick={onSelect}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text-primary, #fafafa)",
            fontFamily: "var(--font-mono, monospace)",
            maxWidth: "70%",
          }}
        >
          {schema.name}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {hasSent && <ThreadIndicator color={SCHEMA_COLOR} />}
          <Pill variant="blue">
            {fieldCount} field{fieldCount !== 1 ? "s" : ""}
          </Pill>
        </div>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--color-text-tertiary, #5a5a5a)",
          marginTop: 4,
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        owner: {truncAddr(schema.owner)}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5a5a5a)", marginTop: 2 }}>
        {versionCount} version{versionCount !== 1 ? "s" : ""}
        {schema.schemaId && <span> · ID: {truncAddr(schema.schemaId)}</span>}
      </div>
    </BaseCard>
  );
};

/* ═══════════════════════════════════════════════════════════
   SchemaDetailCard — expanded view with fields + inline chat
   (previously used old "Schema" type, now uses SchemaState)

   The latest "version" is a Schema (SchemaFragment) which has
   nullable version, agentId, and optional fields array.
   ═══════════════════════════════════════════════════════════ */

interface SchemaDetailCardProps {
  schema: SchemaState;
  onChatSent?: () => void;
}

export const SchemaDetailCard = ({ schema, onChatSent }: SchemaDetailCardProps) => {
  const versions = schema.versions ?? [];
  const latestVersion: Schema | undefined = versions[versions.length - 1];
  const fields = latestVersion?.fields ?? [];

  const chat: CardChatConfig = {
    contextType: "schema",
    contextLabel: `Re: ${schema.name}`,
    placeholder: "Ask about this schema...",
    buildContext: () => ({
      name: schema.name,
      schemaId: schema.schemaId,
      owner: schema.owner,
      versionCount: versions.length,
      latestFields: fields.map((f) => `${f.name} (${f.fieldType})`),
    }),
  };

  return (
    <Card title="Schema Details">
      <FieldRow label="Name" value={schema.name} mono />
      <FieldRow label="Schema ID" value={truncAddr(schema.schemaId)} mono />
      <FieldRow label="Owner" value={truncAddr(schema.owner)} mono />
      <FieldRow label="Versions" value={versions.length} />

      {fields.length > 0 && (
        <div
          style={{
            borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
            paddingTop: 8,
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-text-primary, #fafafa)",
              marginBottom: 8,
            }}
          >
            Fields{latestVersion?.version ? ` (v${latestVersion.version})` : ""}
          </div>
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
        </div>
      )}

      <BaseCard
        chat={chat}
        onChatSent={onChatSent}
        inactiveBg="transparent"
        activeBg="transparent"
        padding="0"
        borderRadius={0}
        style={{ border: "none" }}
      >
        <></>
      </BaseCard>
    </Card>
  );
};