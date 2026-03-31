import { useState, ReactNode } from "react";
import { ACCENT, typeColor } from "@/constants";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Pill badge ─────────────────────────────────────────────
interface PillProps {
  variant?: "green" | "blue" | "amber" | "purple";
  type?: string;
  children: ReactNode;
}

const presets = {
  green: { bg: "#1a3310", fg: "#7ec860" },
  blue: { bg: "#0f2a4a", fg: "#5aa3e8" },
  amber: { bg: "#3d2e0e", fg: "#e8b84a" },
  purple: { bg: "#2a1f4a", fg: "#a98be8" },
};

export const Pill = ({ variant, type, children }: PillProps) => {
  const c = type ? typeColor(type) : presets[variant || "blue"];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        background: c.bg,
        color: c.fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};

// Context type → border color mapping
const CONTEXT_COLORS: Record<string, string> = {
  schema: "#6e8efb",
  manifest: "#a78bfa",
  file: "#34d399",
  field: "#fbbf24",
};

interface BubbleProps {
  role: "user" | "claude" | "system";
  children: ReactNode;
  contextLabel?: string;
  contextType?: string;
}

export const Bubble = ({ role, children, contextLabel, contextType }: BubbleProps) => {
  const isUser = role === "user";
  const borderColor = contextType ? CONTEXT_COLORS[contextType] || "var(--color-border-primary, #3a3a3a)" : undefined;

  const bubbleContent = role === "claude" && typeof children === "string" ? (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
  ) : (
    children
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: 4,
        animation: "fangornFadeIn 0.3s ease-out",
        animationFillMode: "both",
      }}
    >
      {/* Context label */}
      {contextLabel && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: borderColor || "var(--color-text-tertiary, #5a5a5a)",
            fontFamily: "var(--font-mono, monospace)",
            padding: "0 4px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: borderColor || "var(--color-text-tertiary, #5a5a5a)",
            display: "inline-block",
            flexShrink: 0,
          }} />
          {contextLabel}
        </div>
      )}

      <div
        className={role === "claude" ? "markdown-body" : undefined}
        style={{
          maxWidth: "88%",
          padding: "10px 14px",
          borderRadius: 16,
          fontSize: 14,
          lineHeight: 1.55,
          // Context border
          ...(borderColor ? {
            borderLeft: `3px solid ${borderColor}`,
            paddingLeft: 12,
          } : {}),
          ...(isUser
            ? {
                background: "rgba(255, 255, 255, 0.06)",
                border: "0.5px solid var(--color-border-primary, #3a3a3a)",
                color: "var(--color-text-primary, #fafafa)",
                borderBottomRightRadius: 4,
              }
            : {
                background: "var(--color-background-primary, #141414)",
                border: `0.5px solid var(--color-border-tertiary, #1e1e1e)`,
                color: "var(--color-text-primary, #fafafa)",
                borderBottomLeftRadius: 4,
              }),
        }}
      >
        {bubbleContent}
      </div>
    </div>
  );
};

// ─── Card wrapper ───────────────────────────────────────────
interface CardProps {
  title?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}

export const Card = ({ title, children, style }: CardProps) => (
  <div
    style={{
      background: "var(--color-background-primary, #fff)",
      border: "0.5px solid var(--color-border-tertiary, #e0e0e0)",
      borderRadius: 12,
      padding: "12px 14px",
      fontSize: 13,
      animation: "fangornFadeIn 0.3s ease-out",
      ...style,
    }}
  >
    {title && (
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #1a1a1a)", marginBottom: 8 }}>
        {title}
      </div>
    )}
    {children}
  </div>
);

// ─── Field row ──────────────────────────────────────────────
interface FieldRowProps {
  label: string;
  value: string | number;
  mono?: boolean;
  topBorder?: boolean;
}

export const FieldRow = ({ label, value, mono, topBorder }: FieldRowProps) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      color: "var(--color-text-secondary, #666)",
      marginBottom: 5,
      alignItems: "flex-start",
      gap: 8,
      ...(topBorder
        ? { borderTop: "0.5px solid var(--color-border-tertiary, #e0e0e0)", paddingTop: 6, marginTop: 4 }
        : {}),
    }}
  >
    <span style={{ flexShrink: 0 }}>{label}</span>
    <span
      style={{
        color: "var(--color-text-primary, #1a1a1a)",
        textAlign: "right",
        maxWidth: "65%",
        wordBreak: "break-all",
        ...(mono ? { fontFamily: "var(--font-mono, monospace)", fontSize: 11 } : {}),
      }}
    >
      {value}
    </span>
  </div>
);

// ─── Typing indicator ───────────────────────────────────────
export const TypingDots = () => (
  <Bubble role="claude">
    <div style={{ display: "flex", gap: 4, padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--color-text-tertiary, #999)",
            animation: `fangornBlink 1.2s infinite ${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  </Bubble>
);

// ─── Truncate address ───────────────────────────────────────
export const truncAddr = (addr?: string) =>
  addr && addr.length > 16 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr || "—";

// ─── Action button ──────────────────────────────────────────
interface ActionBtnProps {
  children: ReactNode;
  onClick?: () => void;
  ghost?: boolean;
  small?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const ActionBtn = ({ children, onClick, ghost, small, disabled, style: extraStyle }: ActionBtnProps) => (
  <button
    onClick={disabled ? undefined : onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: small ? "5px 10px" : "7px 14px",
      background: disabled
        ? "var(--color-border-tertiary, #e0e0e0)"
        : ghost
          ? "transparent"
          : ACCENT,
      color: disabled
        ? "var(--color-text-tertiary, #999)"
        : ghost
          ? "var(--color-text-primary, #1a1a1a)"
          : "#0f2a4a",
      fontSize: small ? 12 : 13,
      fontWeight: 500,
      border: ghost ? "0.5px solid var(--color-border-secondary, #ccc)" : "none",
      borderRadius: 8,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "opacity 0.15s, transform 0.1s",
      ...extraStyle,
    }}
    onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
    onMouseUp={(e) => !disabled && (e.currentTarget.style.transform = "scale(1)")}
  >
    {children}
  </button>
);

// ─── Encrypted field indicator ──────────────────────────────
export const EncryptedBadge = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: "#e8b84a",
      background: "#3d2e0e",
      padding: "1px 8px",
      borderRadius: 10,
    }}
  >
    🔒 encrypted
  </span>
);

// ─── Pagination controls ────────────────────────────────────
interface PaginationBtnProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}

const PaginationBtn = ({ children, onClick, disabled, active }: PaginationBtnProps) => (
  <button
    onClick={disabled ? undefined : onClick}
    style={{
      width: 28,
      height: 28,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: active ? 600 : 400,
      background: active ? ACCENT : "var(--color-background-primary, #fff)",
      color: active ? "#fff" : disabled ? "var(--color-text-tertiary, #999)" : "var(--color-text-primary, #1a1a1a)",
      border: active ? "none" : "0.5px solid var(--color-border-tertiary, #e0e0e0)",
      borderRadius: 6,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background 0.15s, color 0.15s",
      opacity: disabled && !active ? 0.5 : 1,
    }}
  >
    {children}
  </button>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, loading }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  const pageNumbers: number[] = [];
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        marginTop: 12,
        animation: "fangornFadeIn 0.3s ease-out",
      }}
    >
      <PaginationBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>
        ‹
      </PaginationBtn>
      {start > 1 && (
        <>
          <PaginationBtn onClick={() => onPageChange(1)} disabled={loading}>1</PaginationBtn>
          {start > 2 && <span style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", padding: "0 2px" }}>…</span>}
        </>
      )}
      {pageNumbers.map((p) => (
        <PaginationBtn key={p} active={p === currentPage} onClick={() => onPageChange(p)} disabled={loading}>
          {p}
        </PaginationBtn>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", padding: "0 2px" }}>…</span>}
          <PaginationBtn onClick={() => onPageChange(totalPages)} disabled={loading}>
            {totalPages}
          </PaginationBtn>
        </>
      )}
      <PaginationBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || loading}>
        ›
      </PaginationBtn>
      {loading && (
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", marginLeft: 6 }}>
          loading…
        </span>
      )}
    </div>
  );
};
