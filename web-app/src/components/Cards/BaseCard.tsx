import { useState, ReactNode, CSSProperties } from "react";
import { CardChatConfig, CardChatInput, useChatContext } from "../Chat/Chat";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */



export interface BaseCardProps {
  /** Whether this card is currently selected / expanded */
  isActive?: boolean;
  /** Controlled hasSent — if omitted, BaseCard tracks it internally */
  hasSent?: boolean;
  /** Accent color for the left border + thread indicator */
  accentColor?: string;
  /** Click handler for the outer wrapper */
  onClick?: () => void;
  /** Called after a chat message is successfully sent */
  onChatSent?: () => void;
  /** If provided, renders an inline chat input at the bottom */
  chat?: CardChatConfig;
  /** Border radius — defaults to 12 */
  borderRadius?: number;
  /** Padding — defaults to "10px 12px" */
  padding?: string;
  /** Background when active */
  activeBg?: string;
  /** Background when inactive */
  inactiveBg?: string;
  /** Extra styles on the outer div */
  style?: CSSProperties;
  children: ReactNode;
}

/* ═══════════════════════════════════════════════════════════
   BaseCard
   ═══════════════════════════════════════════════════════════ */

export const BaseCard = ({
  isActive = false,
  hasSent: hasSentProp,
  accentColor = "#6e8efb",
  onClick,
  onChatSent,
  chat,
  borderRadius = 12,
  padding = "10px 12px",
  activeBg = "rgba(255, 255, 255, 0.04)",
  inactiveBg = "var(--color-background-primary, #141414)",
  style,
  children,
}: BaseCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [hasSentInternal, setHasSentInternal] = useState(false);

  // Use controlled prop if provided, otherwise self-managed
  const hasSent = hasSentProp ?? hasSentInternal;

  const handleChatSent = () => {
    if (hasSentProp === undefined) setHasSentInternal(true);
    onChatSent?.();
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isActive ? activeBg : inactiveBg,
        border: `0.5px solid ${
          isActive || hovered
            ? "var(--color-border-primary, #3a3a3a)"
            : "var(--color-border-tertiary, #1e1e1e)"
        }`,
        borderLeft: hasSent ? `3px solid ${accentColor}` : undefined,
        borderRadius,
        padding,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s, background 0.15s",
        ...style,
      }}
    >
      {children}

      {chat && (
        <CardChatInput chat={chat} onChatSent={handleChatSent} />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ThreadIndicator — "● thread" label for sent cards
   ═══════════════════════════════════════════════════════════ */

export const ThreadIndicator = ({ color }: { color: string }) => (
  <span style={{ fontSize: 9, color, fontFamily: "var(--font-mono, monospace)" }}>
    ● thread
  </span>
);

/* ═══════════════════════════════════════════════════════════
   ExpandChevron — ▼ that rotates when expanded
   ═══════════════════════════════════════════════════════════ */

export const ExpandChevron = ({ isExpanded, size = 11 }: { isExpanded: boolean; size?: number }) => (
  <span
    style={{
      fontSize: size,
      color: "var(--color-text-tertiary, #5a5a5a)",
      transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
      transition: "transform 0.2s",
      display: "inline-block",
    }}
  >
    ▼
  </span>
);

/* ═══════════════════════════════════════════════════════════
   DetailRow — key/value row for expanded card details
   ═══════════════════════════════════════════════════════════ */

export const DetailRow = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "2px 0",
      fontSize: 11,
      gap: 8,
    }}
  >
    <span style={{ color: "var(--color-text-secondary, #8a8a8a)", flexShrink: 0 }}>
      {label}
    </span>
    <span
      style={{
        color: "var(--color-text-primary, #fafafa)",
        fontWeight: 500,
        fontFamily: mono ? "var(--font-mono, monospace)" : "inherit",
        textAlign: "right",
        wordBreak: "break-all",
      }}
    >
      {value}
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   ExpandedSection — stopPropagation wrapper for expand content
   ═══════════════════════════════════════════════════════════ */

export const ExpandedSection = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      marginTop: 10,
      borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
      paddingTop: 8,
    }}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </div>
);