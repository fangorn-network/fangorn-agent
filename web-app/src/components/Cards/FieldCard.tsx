import type { FileField } from "@fangorn-network/client-types";
import { Pill, EncryptedBadge, truncAddr } from "../primitives";
import {
  BaseCard,
  CardChatConfig,
  ThreadIndicator,
  ExpandChevron,
  ExpandedSection,
  DetailRow,
} from "./BaseCard";

const FIELD_COLOR = "#fbbf24";

/* ═══════════════════════════════════════════════════════════
   FieldCard
   Uses FileField (FileFieldFragment) — nullable fields:
     - name: string | null
     - value: string | null
     - atType: string | null
     - acc: string | null
     - pricing: PricingResource | null  (replaces old .price)
   Non-nullable:
     - id: string
   Removed (not on fragment):
     - manifestState, fileEntry
   ═══════════════════════════════════════════════════════════ */

interface FieldCardProps {
  field: FileField;
  index: number;
  isExpanded: boolean;
  hasSent?: boolean;
  onToggle: () => void;
  onChatSent?: () => void;
}

export const FieldCard = ({
  field,
  index,
  isExpanded,
  hasSent,
  onToggle,
  onChatSent,
}: FieldCardProps) => {
  const fieldName = field.name ?? "Unnamed";
  const fieldValue = field.value ?? "";
  const fieldType = field.atType ?? "unknown";
  const accessLevel = field.acc ?? "unknown";
  const isEncrypted = accessLevel !== "plain";
  const hasPrice = field.pricing != null && Number(field.pricing.price) > 0;

  const chat: CardChatConfig = {
    contextType: "field",
    contextLabel: `Re: "${fieldName}: ${fieldValue}"`,
    placeholder: "Ask about this field...",
    buildContext: () => ({
      id: field.id,
      name: fieldName,
      value: isEncrypted ? `[${accessLevel}]` : fieldValue,
      atType: fieldType,
      acc: accessLevel,
      pricing: field.pricing
        ? { price: field.pricing.price, currency: field.pricing.currency }
        : null,
    }),
  };

  return (
    <BaseCard
      isActive={isExpanded}
      hasSent={hasSent}
      accentColor={FIELD_COLOR}
      onClick={onToggle}
      onChatSent={() => {
        onToggle();
        onChatSent?.();
      }}
      chat={isExpanded ? chat : undefined}
    >
      {/* ── Header row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ maxWidth: "55%" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-primary, #fafafa)",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {fieldName}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary, #8a8a8a)",
              marginTop: 2,
              wordBreak: "break-all",
            }}
          >
            {isEncrypted ? <EncryptedBadge /> : fieldValue}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {hasSent && <ThreadIndicator color={FIELD_COLOR} />}
          <Pill type={fieldType}>{fieldType}</Pill>
          {isEncrypted && <Pill variant="amber">🔒</Pill>}
          {hasPrice && (
            <Pill variant="green">${Number(field.pricing!.price).toFixed(2)}</Pill>
          )}
          <ExpandChevron isExpanded={isExpanded} />
        </div>
      </div>

      {/* ── Expanded details ── */}
      {isExpanded && (
        <ExpandedSection>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <DetailRow label="ID" value={truncAddr(field.id)} mono />
            <DetailRow label="Type" value={fieldType} />
            <DetailRow label="Access" value={accessLevel} />
            {field.pricing && (
              <>
                <DetailRow
                  label="Price"
                  value={`${field.pricing.price} ${field.pricing.currency}`}
                />
                <DetailRow label="Price owner" value={truncAddr(field.pricing.owner)} mono />
              </>
            )}
          </div>
        </ExpandedSection>
      )}
    </BaseCard>
  );
};