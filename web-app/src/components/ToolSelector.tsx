"use client";

import { useState, useRef, useEffect } from "react";
import type { ToolboxMap } from "@/hooks/useToolboxSelection";

/* ── colour tokens (reuse Fangorn palette) ────────────────── */
const C = {
  bg: "var(--color-background-primary, #141414)",
  bgAlt: "var(--color-background-secondary, #0e0e0e)",
  border: "var(--color-border-secondary, #2a2a2a)",
  borderSubtle: "var(--color-border-tertiary, #1e1e1e)",
  text: "var(--color-text-primary, #fafafa)",
  textDim: "var(--color-text-secondary, #999)",
  textMuted: "var(--color-text-tertiary, #5a5a5a)",
  accent: "#7cb77a", // earthy green — fits "Fangorn"
  accentDim: "#3d5e3c",
} as const;

/* ── types ─────────────────────────────────────────────────── */
interface ToolSelectorProps {
  toolboxMap: ToolboxMap;
  selectedTools: Set<string>;
  loading: boolean;
  error: string | null;
  toggleTool: (name: string) => void;
  toggleToolbox: (name: string) => void;
  clearAll: () => void;
  selectAll: () => void;
}

/* ── component ─────────────────────────────────────────────── */
export default function ToolSelector({
  toolboxMap,
  selectedTools,
  loading,
  error,
  toggleTool,
  toggleToolbox,
  clearAll,
  selectAll,
}: ToolSelectorProps) {
  const [open, setOpen] = useState(false);
  const [expandedBoxes, setExpandedBoxes] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const totalCount = selectedTools.size;
  const toolboxNames = Object.keys(toolboxMap);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const toggleExpand = (name: string) => {
    setExpandedBoxes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  /* ── trigger button ─────────────────────────────────────── */
  const triggerButton = (
    <button
      ref={triggerRef}
      onClick={() => setOpen((v) => !v)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: `0.5px solid ${open ? C.accent : C.borderSubtle}`,
        borderRadius: 8,
        padding: "5px 10px",
        background: open ? "rgba(124,183,122,0.08)" : "transparent",
        color: totalCount > 0 ? C.accent : C.textMuted,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "var(--font-mono, monospace)",
        cursor: "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      title="Select tools"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
      Tools{totalCount > 0 ? ` (${totalCount})` : ""}
    </button>
  );

  /* ── popover panel ──────────────────────────────────────── */
  const panel = open ? (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: 0,
        width: 320,
        maxHeight: 420,
        background: C.bg,
        border: `0.5px solid ${C.border}`,
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "fangornFadeIn 0.15s ease-out",
        zIndex: 100,
      }}
    >
      {/* header */}
      <div
        style={{
          padding: "12px 14px 10px",
          borderBottom: `0.5px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: C.text,
            fontFamily: "var(--font-mono, monospace)",
            letterSpacing: "0.02em",
          }}
        >
          Toolboxes
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <PillButton onClick={selectAll} label="All" />
          <PillButton onClick={clearAll} label="None" />
        </div>
      </div>

      {/* body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "6px 0",
        }}
      >
        {loading && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: C.textMuted,
              fontSize: 12,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            Loading tools…
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "#e55",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          toolboxNames.map((boxName) => {
            const tools = toolboxMap[boxName];
            const selectedInBox = tools.filter((t) => selectedTools.has(t));
            const allSelected =
              tools.length > 0 && selectedInBox.length === tools.length;
            const someSelected = selectedInBox.length > 0 && !allSelected;
            const expanded = expandedBoxes.has(boxName);

            return (
              <div key={boxName}>
                {/* toolbox row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 14px",
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  {/* expand chevron */}
                  <span
                    onClick={() => toggleExpand(boxName)}
                    style={{
                      fontSize: 10,
                      color: C.textMuted,
                      width: 14,
                      textAlign: "center",
                      flexShrink: 0,
                      transition: "transform 0.15s",
                      transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  >
                    ▶
                  </span>

                  {/* checkbox */}
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => toggleToolbox(boxName)}
                  />

                  {/* label */}
                  <span
                    onClick={() => toggleExpand(boxName)}
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 500,
                      color: C.text,
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    {boxName}
                  </span>

                  {/* count badge */}
                  <span
                    style={{
                      fontSize: 10,
                      color:
                        someSelected || allSelected ? C.accent : C.textMuted,
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 500,
                    }}
                  >
                    {selectedInBox.length}/{tools.length}
                  </span>
                </div>

                {/* expanded tool list */}
                {expanded && (
                  <div
                    style={{
                      paddingLeft: 36,
                      paddingBottom: 4,
                      animation: "fangornFadeIn 0.12s ease-out",
                    }}
                  >
                    {tools.map((toolName) => {
                      const isSelected = selectedTools.has(toolName);
                      return (
                        <div
                          key={toolName}
                          onClick={() => toggleTool(toolName)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "4px 14px 4px 0",
                            cursor: "pointer",
                            userSelect: "none",
                            borderRadius: 4,
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.background =
                              "rgba(255,255,255,0.025)")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.background =
                              "transparent")
                          }
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleTool(toolName)}
                          />
                          <span
                            style={{
                              fontSize: 11,
                              color: isSelected ? C.textDim : C.textMuted,
                              fontFamily: "var(--font-mono, monospace)",
                              transition: "color 0.1s",
                            }}
                          >
                            {toolName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        {!loading && !error && toolboxNames.length === 0 && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: C.textMuted,
              fontSize: 12,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            No toolboxes available
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div style={{ position: "relative" }}>
      {panel}
      {triggerButton}
    </div>
  );
}

/* ── small sub-components ──────────────────────────────────── */

function Checkbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        border: `1.5px solid ${
          checked || indeterminate ? C.accent : C.textMuted
        }`,
        background: checked
          ? C.accent
          : indeterminate
            ? C.accentDim
            : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.12s",
      }}
    >
      {checked && (
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-5"
            stroke={C.bg}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {indeterminate && !checked && (
        <div
          style={{
            width: 7,
            height: 1.5,
            borderRadius: 1,
            background: C.accent,
          }}
        />
      )}
    </div>
  );
}

function PillButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `0.5px solid ${C.borderSubtle}`,
        borderRadius: 6,
        padding: "2px 8px",
        background: "transparent",
        color: C.textDim,
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "var(--font-mono, monospace)",
        cursor: "pointer",
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.borderColor = C.accent;
        (e.target as HTMLElement).style.color = C.accent;
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.borderColor = C.borderSubtle;
        (e.target as HTMLElement).style.color = C.textDim;
      }}
    >
      {label}
    </button>
  );
}
