import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ActivityItem } from "@/hooks/useAgent";

interface BubbleProps {
  role: "user" | "agent" | "system";
  children: ReactNode;
}

export const Bubble = ({ role, children }: BubbleProps) => {
  const isUser = role === "user";

  const bubbleContent =
    role === "agent" && typeof children === "string" ? (
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
      <div
        className={role === "agent" ? "markdown-body" : undefined}
        style={{
          maxWidth: "88%",
          padding: "10px 14px",
          borderRadius: 16,
          fontSize: 14,
          lineHeight: 1.55,
          ...(isUser
            ? {
                background: "rgba(255, 255, 255, 0.06)",
                border: "0.5px solid var(--color-border-primary, #3a3a3a)",
                color: "var(--color-text-primary, #fafafa)",
                borderBottomRightRadius: 4,
                whiteSpace: "pre-wrap" as const,
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

/**
 * Live log of what the agent is doing while it works: thoughts (dim,
 * italic), interim notes, and tool calls with running/done/error status.
 */
export const ActivityLog = ({ items }: { items: ActivityItem[] }) => {
  if (items.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        maxWidth: "88%",
        padding: "4px 0 4px 12px",
        borderLeft: "2px solid var(--color-border-secondary, #2a2a2a)",
        animation: "fangornFadeIn 0.3s ease-out",
        animationFillMode: "both",
      }}
    >
      {items.map((item) => {
        if (item.kind === "tool") {
          const icon =
            item.status === "running"
              ? "●"
              : item.status === "error"
                ? "✗"
                : "✓";
          const iconColor =
            item.status === "running"
              ? "var(--color-text-secondary, #8a8a8a)"
              : item.status === "error"
                ? "#e8b84a"
                : "#7cb77a";
          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                fontSize: 11,
                fontFamily: "var(--font-mono, monospace)",
                color: "var(--color-text-secondary, #8a8a8a)",
              }}
            >
              <span
                style={{
                  color: iconColor,
                  flexShrink: 0,
                  animation:
                    item.status === "running"
                      ? "fangornBlink 1.2s infinite"
                      : undefined,
                }}
              >
                {icon}
              </span>
              <span style={{ color: "var(--color-text-primary, #fafafa)" }}>
                {item.text}
              </span>
              {item.detail && (
                <span
                  style={{
                    color: "var(--color-text-tertiary, #5a5a5a)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.detail}
                >
                  {item.detail}
                </span>
              )}
            </div>
          );
        }
        return (
          <div
            key={item.id}
            style={{
              fontSize: 11,
              lineHeight: 1.5,
              fontFamily: "var(--font-mono, monospace)",
              color: "var(--color-text-tertiary, #5a5a5a)",
              fontStyle: item.kind === "thought" ? "italic" : "normal",
            }}
          >
            {item.kind === "thought" ? "💭 " : "✎ "}
            {item.text}
          </div>
        );
      })}
    </div>
  );
};

export const TypingDots = () => (
  <Bubble role="agent">
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
