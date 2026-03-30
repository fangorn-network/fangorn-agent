import { useState, useMemo, useRef, useEffect } from "react";
import { ManifestState } from "../types/subgraph";

interface ActiveFilter {
  fieldName: string;
  value: string;
}

interface FilterBarProps {
  manifestData: ManifestState[];
  activeFilters: ActiveFilter[];
  onFiltersChange: (filters: ActiveFilter[]) => void;
}

/**
 * Extracts all unique field names and their unique values from manifest data.
 * Returns a Map<fieldName, Set<value>>.
 */
function extractFieldOptions(manifests: ManifestState[]): Map<string, string[]> {
  const fieldMap = new Map<string, Set<string>>();

  for (const ms of manifests) {
    const files = ms.manifest?.files || [];
    for (const file of files) {
      for (const field of file.fields) {
        const name = field.name;
        if (!name) continue;

        if (!fieldMap.has(name)) {
          fieldMap.set(name, new Set());
        }

        const val = field.value ?? (field.acc !== "plain" ? "(encrypted)" : "(empty)");
        fieldMap.get(name)!.add(val);
      }
    }
  }

  // Convert Sets to sorted arrays
  const result = new Map<string, string[]>();
  for (const [name, values] of fieldMap) {
    const sorted = Array.from(values).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    result.set(name, sorted);
  }
  return result;
}

/* ── Dropdown for a single field ── */

interface FieldDropdownProps {
  fieldName: string;
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}

const FieldDropdown = ({ fieldName, options, selectedValue, onSelect }: FieldDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isActive = selectedValue !== null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "5px 10px",
          fontSize: 11,
          fontWeight: 500,
          fontFamily: "var(--font-mono, monospace)",
          background: isActive
            ? "rgba(255, 255, 255, 0.08)"
            : "var(--color-background-primary, #141414)",
          border: `0.5px solid ${
            isActive
              ? "var(--color-border-primary, #3a3a3a)"
              : "var(--color-border-tertiary, #1e1e1e)"
          }`,
          borderRadius: 7,
          color: isActive
            ? "var(--color-text-primary, #fafafa)"
            : "var(--color-text-secondary, #8a8a8a)",
          cursor: "pointer",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {fieldName}
        {isActive && (
          <span
            style={{
              fontSize: 10,
              color: "var(--color-text-tertiary, #5a5a5a)",
              maxWidth: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            : {selectedValue}
          </span>
        )}
        <span
          style={{
            fontSize: 9,
            marginLeft: 2,
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.15s",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            minWidth: 160,
            maxHeight: 200,
            overflowY: "auto",
            background: "var(--color-background-primary, #141414)",
            border: "0.5px solid var(--color-border-primary, #3a3a3a)",
            borderRadius: 8,
            padding: 4,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Clear option */}
          {isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "5px 8px",
                fontSize: 11,
                fontStyle: "italic",
                color: "var(--color-text-tertiary, #5a5a5a)",
                background: "none",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.background = "rgba(255,255,255,0.04)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.background = "none")
              }
            >
              Clear filter
            </button>
          )}

          {options.map((val) => {
            const isCurrent = val === selectedValue;
            return (
              <button
                key={val}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(isCurrent ? null : val);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "5px 8px",
                  fontSize: 11,
                  fontFamily: "var(--font-mono, monospace)",
                  color: isCurrent
                    ? "var(--color-text-primary, #fafafa)"
                    : "var(--color-text-secondary, #8a8a8a)",
                  background: isCurrent ? "rgba(255,255,255,0.06)" : "none",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                  transition: "background 0.1s",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent)
                    (e.target as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent)
                    (e.target as HTMLElement).style.background = "none";
                }}
              >
                {val}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── FilterBar ── */

export const FilterBar = ({ manifestData, activeFilters, onFiltersChange }: FilterBarProps) => {
  const fieldOptions = useMemo(() => extractFieldOptions(manifestData), [manifestData]);

  const fieldNames = useMemo(() => Array.from(fieldOptions.keys()), [fieldOptions]);

  if (fieldNames.length === 0) return null;

  const handleFieldSelect = (fieldName: string, value: string | null) => {
    if (value === null) {
      // Remove this field's filter
      onFiltersChange(activeFilters.filter((f) => f.fieldName !== fieldName));
    } else {
      // Add or update
      const existing = activeFilters.filter((f) => f.fieldName !== fieldName);
      onFiltersChange([...existing, { fieldName, value }]);
    }
  };

  const activeCount = activeFilters.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "var(--color-text-tertiary, #5a5a5a)",
        }}
      >
        <span>Filter by field:</span>
        {activeCount > 0 && (
          <button
            onClick={() => onFiltersChange([])}
            style={{
              border: "none",
              background: "none",
              color: "var(--color-text-secondary, #8a8a8a)",
              fontSize: 10,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 2,
              fontFamily: "var(--font-body, sans-serif)",
            }}
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {fieldNames.map((name) => {
          const activeFilter = activeFilters.find((f) => f.fieldName === name);
          return (
            <FieldDropdown
              key={name}
              fieldName={name}
              options={fieldOptions.get(name) || []}
              selectedValue={activeFilter?.value ?? null}
              onSelect={(val) => handleFieldSelect(name, val)}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ── Helper: apply filters to manifest data ── */

export function applyFilters(
  manifests: ManifestState[],
  filters: ActiveFilter[]
): ManifestState[] {
  if (filters.length === 0) return manifests;

  return manifests.filter((ms) => {
    const files = ms.manifest?.files || [];
    // A manifest matches if ANY of its files match ALL active filters
    return files.some((file) =>
      filters.every((filter) =>
        file.fields.some((f) => {
          if (f.name !== filter.fieldName) return false;
          const val = f.value ?? (f.acc !== "plain" ? "(encrypted)" : "(empty)");
          return val === filter.value;
        })
      )
    );
  });
}

export type { ActiveFilter };