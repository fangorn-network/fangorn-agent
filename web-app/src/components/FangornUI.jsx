import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   Fangorn Subgraph UI
   ═══════════════════════════════════════════════════════════════
   UI component for browsing schemas and querying data from the
   Fangorn subgraph. All data comes from MCP tool responses —
   pass schemas and dataEntries as props.

   Two flows: Browse Schemas and Query Data.

   Pagination: Display 5 records per page. When the user reaches
   the second-to-last page of the current batch, use sendPrompt
   to request the next 30 records.
   ═══════════════════════════════════════════════════════════════ */

// ─── No default data — all content comes from MCP responses ──

// ─── Pagination constants ───────────────────────────────────
const PAGE_SIZE = 5;
const FETCH_BATCH = 40;
const PREFETCH_BATCH = 30;

// ─── Accent & palette (dark theme) ──────────────────────────
const ACCENT = "#378ADD";
const ACCENT_BG = "#0f2a4a";
const ACCENT_DARK = "#5aa3e8";

// ─── Type → pill color map (dark theme) ─────────────────────
const typeColor = (t) => {
  if (t === "encrypted") return { bg: "#3d2e0e", fg: "#e8b84a" };
  if (t === "string") return { bg: "#0f2a4a", fg: "#5aa3e8" };
  if (t === "number" || t === "integer") return { bg: "#1a3310", fg: "#7ec860" };
  return { bg: "#2a1f4a", fg: "#a98be8" };
};

// ─── Pill badge ─────────────────────────────────────────────
const Pill = ({ variant, type, children }) => {
  const presets = {
    green: { bg: "#1a3310", fg: "#7ec860" },
    blue: { bg: "#0f2a4a", fg: "#5aa3e8" },
    amber: { bg: "#3d2e0e", fg: "#e8b84a" },
    purple: { bg: "#2a1f4a", fg: "#a98be8" },
  };
  const c = type ? typeColor(type) : presets[variant] || presets.blue;
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

// ─── Chat bubbles ───────────────────────────────────────────
const Bubble = ({ role, children }) => {
  const isUser = role === "user";
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
        style={{
          maxWidth: "88%",
          padding: "10px 14px",
          borderRadius: 16,
          fontSize: 14,
          lineHeight: 1.55,
          ...(isUser
            ? { background: ACCENT, color: ACCENT_BG, borderBottomRightRadius: 4 }
            : {
                background: "var(--color-background-primary, #fff)",
                border: "0.5px solid var(--color-border-tertiary, #e0e0e0)",
                color: "var(--color-text-primary, #1a1a1a)",
                borderBottomLeftRadius: 4,
              }),
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ─── Card wrapper ───────────────────────────────────────────
const Card = ({ title, children, style }) => (
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
const FieldRow = ({ label, value, mono, topBorder }) => (
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
const TypingDots = () => (
  <Bubble role="claude">
    <div style={{ display: "flex", gap: 4, padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--color-text-tertiary, #999)",
            animation: `fangornBlink 1.2s infinite ${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  </Bubble>
);

// ─── Truncate address ───────────────────────────────────────
const truncAddr = (addr) =>
  addr && addr.length > 16 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr || "—";

// ─── Buttons ────────────────────────────────────────────────
const ActionBtn = ({ children, onClick, ghost, small, disabled, style: extraStyle }) => (
  <button
    onClick={disabled ? undefined : onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: small ? "5px 10px" : "7px 14px",
      background: disabled ? "var(--color-border-tertiary, #e0e0e0)" : ghost ? "transparent" : ACCENT,
      color: disabled ? "var(--color-text-tertiary, #999)" : ghost ? "var(--color-text-primary, #1a1a1a)" : ACCENT_BG,
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

// ─── Pagination controls ────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, loading }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
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
      <PaginationBtn
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
      >
        ‹
      </PaginationBtn>
      {start > 1 && (
        <>
          <PaginationBtn onClick={() => onPageChange(1)} disabled={loading}>1</PaginationBtn>
          {start > 2 && <span style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", padding: "0 2px" }}>…</span>}
        </>
      )}
      {pageNumbers.map((p) => (
        <PaginationBtn
          key={p}
          active={p === currentPage}
          onClick={() => onPageChange(p)}
          disabled={loading}
        >
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
      <PaginationBtn
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
      >
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

const PaginationBtn = ({ children, onClick, disabled, active }) => (
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

// ─── Encrypted field indicator (inline, no price) ───────────
const EncryptedBadge = () => (
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

// ═════════════════════════════════════════════════════════════
// BROWSE SCHEMAS FLOW
// ═════════════════════════════════════════════════════════════
const BrowseFlow = ({ schemas = [], initialDetail, onQuerySchema }) => {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [selected, setSelected] = useState(initialDetail || null);
  const threadRef = useRef(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, 60);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setTyping(true), 800);
    const t3 = setTimeout(() => { setTyping(false); setStep(2); }, 1800);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  useEffect(scrollDown, [step, typing, selected, scrollDown]);

  const handleSelect = (schema) => {
    setSelected((prev) => (prev?.name === schema.name ? null : schema));
    if (!selected || selected.name !== schema.name) setStep(3);
  };

  return (
    <div ref={threadRef} style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 320, overflowY: "auto" }}>
      <Bubble role="claude">
        Here are the schemas registered on the subgraph. Select one to inspect its field definitions.
      </Bubble>

      {step >= 1 && <Bubble role="user">Show me what's registered.</Bubble>}
      {typing && <TypingDots />}

      {step >= 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fangornFadeIn 0.3s ease-out" }}>
          <Bubble role="claude">
            Found {schemas.length} schema{schemas.length !== 1 ? "s" : ""} — click one to inspect:
          </Bubble>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4, width: "100%" }}>
            {schemas.map((s) => {
              const latestVersion = s.versions?.[s.versions.length - 1];
              const fieldCount = latestVersion?.fields?.length || 0;
              const isSelected = selected?.name === s.name;
              return (
                <div key={s.name}>
                  <SchemaCard
                    schema={s}
                    fieldCount={fieldCount}
                    selected={isSelected}
                    onSelect={() => handleSelect(s)}
                  />
                  {isSelected && (
                    <div style={{ animation: "fangornFadeIn 0.3s ease-out", marginTop: 8 }}>
                      <SchemaDetailCard schema={s} />
                      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                        <ActionBtn onClick={() => onQuerySchema && onQuerySchema(s.name)}>
                          Query data for this schema
                        </ActionBtn>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Schema list card ───────────────────────────────────────
const SchemaCard = ({ schema, fieldCount, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? ACCENT_BG : "var(--color-background-primary, #fff)",
        border: `0.5px solid ${selected ? ACCENT : hovered ? "var(--color-border-primary, #aaa)" : "var(--color-border-tertiary, #e0e0e0)"}`,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #1a1a1a)", fontFamily: "var(--font-mono, monospace)", maxWidth: "70%" }}>
          {schema.name}
        </div>
        <Pill variant="blue">{fieldCount} field{fieldCount !== 1 ? "s" : ""}</Pill>
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", marginTop: 4, fontFamily: "var(--font-mono, monospace)" }}>
        owner: {truncAddr(schema.owner)}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", marginTop: 2 }}>
        {schema.versions?.length || 0} version{(schema.versions?.length || 0) !== 1 ? "s" : ""}
        {schema.schemaId && <span> · ID: {truncAddr(schema.schemaId)}</span>}
      </div>
    </div>
  );
};

// ─── Schema detail card ─────────────────────────────────────
const SchemaDetailCard = ({ schema }) => {
  const latestVersion = schema.versions?.[schema.versions.length - 1];
  return (
    <Card title="Schema Details">
      <FieldRow label="Name" value={schema.name} mono />
      <FieldRow label="Schema ID" value={truncAddr(schema.schemaId)} mono />
      <FieldRow label="Owner" value={truncAddr(schema.owner)} mono />
      <FieldRow label="Versions" value={schema.versions?.length || 0} />
      {latestVersion?.spec_cid && (
        <FieldRow label="Spec CID" value={truncAddr(latestVersion.spec_cid)} mono />
      )}
      {latestVersion?.fields && (
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary, #e0e0e0)", paddingTop: 8, marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary, #1a1a1a)", marginBottom: 8 }}>
            Fields (v{latestVersion.version})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {latestVersion.fields.map((f) => (
              <div
                key={f.name}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 10px",
                  background: "var(--color-background-secondary, #f5f5f5)",
                  borderRadius: 8, fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 500, color: "var(--color-text-primary, #1a1a1a)" }}>{f.name}</span>
                <Pill type={f.fieldType}>{f.fieldType}</Pill>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// ═════════════════════════════════════════════════════════════
// QUERY DATA FLOW
// ═════════════════════════════════════════════════════════════
const QueryFlow = ({
  dataEntries = [],
  schemaName = "",
  autoLoad = false,
}) => {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [expandedFile, setExpandedFile] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [prefetchRequested, setPrefetchRequested] = useState(false);
  const threadRef = useRef(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, 60);
  }, []);

  // React to new data arriving via props (from MCP responses)
  useEffect(() => {
    if (dataEntries.length > 0 && submitted) {
      setTyping(false);
      setStep(2);
    }
  }, [dataEntries, submitted]);

  // If autoLoad (came from Browse), mark as submitted and wait for data
  useEffect(() => {
    if (autoLoad && schemaName) {
      setSubmitted(true);
      setStep(1);
      setTyping(true);
    }
  }, [autoLoad, schemaName]);

  useEffect(scrollDown, [step, typing, expandedFile, currentPage, scrollDown]);

  const handleLoadAll = () => {
    if (!schemaName) return;
    setSubmitted(true);
    setStep(1);
    setTyping(true);
    setTimeout(() => { setTyping(false); setStep(2); }, 1400);

    // Actually fetch data from the MCP server
    if (typeof sendPrompt === "function") {
    console.log(`Query the first 40 data entries for schema "${schemaName}". Use JSON response format.`)
      sendPrompt(`Query the first 40 data entries for schema "${schemaName}". Use JSON response format.`);
    }
  };

  const handleFilterSubmit = () => {
    if (!filterText.trim()) return;
    if (typeof sendPrompt === "function") {
        console.log(`Sending prompt: Query data for schema "${schemaName}" where ${filterText}. Use JSON response format.`)
      sendPrompt(`Query data for schema "${schemaName}" where ${filterText}. Use JSON response format.`);
    }
  };

  // Flatten all files from all entries
  const allFiles = dataEntries.flatMap((entry) =>
    (entry.manifest?.files || []).map((file, idx) => ({
      ...file,
      owner: entry.owner,
      _idx: idx,
      _entrySchema: entry.schema_name,
    }))
  );

  const totalFiles = allFiles.length;
  const totalPages = Math.max(1, Math.ceil(totalFiles / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageFiles = allFiles.slice(pageStart, pageStart + PAGE_SIZE);

  // Pre-fetch: when user reaches second-to-last page, request next batch
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setExpandedFile(null);

    // Check if we should pre-fetch
    if (page >= totalPages - 1 && !prefetchRequested && totalFiles >= FETCH_BATCH) {
      setPrefetchRequested(true);
      if (typeof sendPrompt === "function") {
        sendPrompt(
          `Fetch next ${PREFETCH_BATCH} data entries for schema "${schemaName}" starting from offset ${totalFiles}. Use JSON response format. Append them to the current results.`
        );
      }
    }
  };

  return (
    <div ref={threadRef} style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 320, overflowY: "auto" }}>
      {/* Initial state */}
      {!submitted && (
        <>
          <Bubble role="claude">
            {schemaName
              ? <>Ready to query <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}>{schemaName}</span>. You can load data directly or describe a filter first.</>
              : "Which schema would you like to query? You can browse schemas first to pick one."
            }
          </Bubble>

          {schemaName && (
            <div style={{ animation: "fangornFadeIn 0.3s ease-out" }}>
              <div
                style={{
                  display: "flex", gap: 6, alignItems: "stretch",
                  background: "var(--color-background-primary, #fff)",
                  border: "0.5px solid var(--color-border-tertiary, #e0e0e0)",
                  borderRadius: 10, padding: 4,
                }}
              >
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (filterText.trim() ? handleFilterSubmit() : handleLoadAll())}
                  placeholder='e.g. "artist is FANGORN"'
                  style={{
                    flex: 1, border: "none", outline: "none",
                    fontSize: 13, padding: "6px 8px",
                    background: "transparent",
                    color: "var(--color-text-primary, #1a1a1a)",
                  }}
                />
                {filterText.trim() ? (
                  <ActionBtn small onClick={handleFilterSubmit}>Filter</ActionBtn>
                ) : (
                  <ActionBtn small onClick={handleLoadAll}>Load all</ActionBtn>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", marginTop: 4, paddingLeft: 4 }}>
                Describe a field filter or click "Load all"
              </div>
            </div>
          )}
        </>
      )}

      {/* After query initiated */}
      {submitted && step >= 1 && (
        <Bubble role="user">
          {filterText.trim()
            ? `Query ${schemaName} where ${filterText}`
            : `Show me data for ${schemaName}`
          }
        </Bubble>
      )}

      {typing && <TypingDots />}

      {step >= 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fangornFadeIn 0.3s ease-out" }}>
          <Bubble role="claude">
            {totalFiles === 0
              ? "No records found for this query."
              : <>
                  Found {totalFiles} record{totalFiles !== 1 ? "s" : ""}. Showing page {currentPage} of {totalPages}:
                </>
            }
          </Bubble>

          {pageFiles.length > 0 && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, width: "100%" }}>
                {pageFiles.map((file, i) => {
                  const globalIdx = pageStart + i;
                  const isExpanded = expandedFile === globalIdx;
                  const plainFields = file.fields.filter((f) => f.acc === "plain");
                  const encFields = file.fields.filter((f) => f.acc !== "plain");
                  const summaryField = plainFields[0];
                  const secondaryField = plainFields.length > 1 ? plainFields[1] : null;
                  const totalEncPrice = encFields.reduce((sum, f) => sum + (f.price != null ? Number(f.price) : 0), 0);

                  return (
                    <DataRecordCard
                      key={globalIdx}
                      index={globalIdx}
                      file={file}
                      plainFields={plainFields}
                      encFields={encFields}
                      summaryField={summaryField}
                      secondaryField={secondaryField}
                      totalEncPrice={totalEncPrice}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedFile(isExpanded ? null : globalIdx)}
                    />
                  );
                })}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}

          {/* Post-results filter input */}
          <div style={{ marginTop: 4, animation: "fangornFadeIn 0.3s ease-out" }}>
            <div
              style={{
                display: "flex", gap: 6, alignItems: "stretch",
                background: "var(--color-background-primary, #fff)",
                border: "0.5px solid var(--color-border-tertiary, #e0e0e0)",
                borderRadius: 10, padding: 4,
              }}
            >
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && filterText.trim() && handleFilterSubmit()}
                placeholder='Refine: e.g. "genre is Lo-Fi"'
                style={{
                  flex: 1, border: "none", outline: "none",
                  fontSize: 13, padding: "6px 8px",
                  background: "transparent",
                  color: "var(--color-text-primary, #1a1a1a)",
                }}
              />
              <ActionBtn small onClick={handleFilterSubmit} disabled={!filterText.trim()}>
                Query
              </ActionBtn>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", marginTop: 4, paddingLeft: 4 }}>
              Describe a filter to narrow results — I'll re-query the subgraph for you
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Data record card ───────────────────────────────────────
const DataRecordCard = ({ index, file, plainFields, encFields, summaryField, secondaryField, totalEncPrice, isExpanded, onToggle }) => {
  const [hovered, setHovered] = useState(false);

  const handlePurchase = (e) => {
    e.stopPropagation();
    const label = summaryField ? summaryField.value : `Record ${index + 1}`;
    if (typeof sendPrompt === "function") {
      sendPrompt(`Purchase encrypted fields for "${label}" from schema "${file._entrySchema}"`);
    }
  };

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isExpanded ? ACCENT_BG : "var(--color-background-primary, #fff)",
        border: `0.5px solid ${isExpanded ? ACCENT : hovered ? "var(--color-border-primary, #aaa)" : "var(--color-border-tertiary, #e0e0e0)"}`,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Collapsed summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ maxWidth: "60%" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary, #1a1a1a)" }}>
            {summaryField ? summaryField.value : `Record ${index + 1}`}
          </div>
          {secondaryField && (
            <div style={{ fontSize: 11, color: "var(--color-text-secondary, #666)", marginTop: 2 }}>
              {secondaryField.name}: {secondaryField.value}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {encFields.length > 0 && totalEncPrice > 0 && (
            <Pill variant="green">${totalEncPrice.toFixed(2)}</Pill>
          )}
          {encFields.length > 0 && (
            <Pill variant="amber">🔒 {encFields.length}</Pill>
          )}
          <span style={{
            fontSize: 11, color: "var(--color-text-tertiary, #999)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s", display: "inline-block",
          }}>▼</span>
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div
          style={{ marginTop: 10, borderTop: "0.5px solid var(--color-border-tertiary, #e0e0e0)", paddingTop: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          {file.fields.map((f) => (
            <div key={f.name}>
              <div
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "4px 0", fontSize: 12, gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ color: "var(--color-text-secondary, #666)" }}>{f.name}</span>
                  <Pill type={f.atType}>{f.atType}</Pill>
                </div>
                <div style={{ textAlign: "right", maxWidth: "55%", wordBreak: "break-all" }}>
                  {f.acc === "plain" ? (
                    <span style={{ color: "var(--color-text-primary, #1a1a1a)", fontWeight: 500 }}>{f.value}</span>
                  ) : (
                    <EncryptedBadge />
                  )}
                </div>
              </div>
              {/* Dedicated price row for encrypted fields */}
              {f.acc !== "plain" && f.price != null && f.price > 0 && (
                <div
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "2px 0 4px 16px", fontSize: 11,
                  }}
                >
                  <span style={{ color: "var(--color-text-tertiary, #999)" }}>price</span>
                  <Pill variant="green">${Number(f.price).toFixed(2)} USDC</Pill>
                </div>
              )}
            </div>
          ))}

          {file.owner && (
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
              source: {truncAddr(file.owner)}
            </div>
          )}

          {/* Purchase button */}
          {encFields.length > 0 && (
            <div style={{
              marginTop: 10, paddingTop: 8,
              borderTop: "0.5px solid var(--color-border-tertiary, #e0e0e0)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary, #666)" }}>
                {encFields.length} encrypted field{encFields.length !== 1 ? "s" : ""}
                {totalEncPrice > 0 && ` · $${totalEncPrice.toFixed(2)} total`}
              </div>
              <ActionBtn small onClick={handlePurchase}>
                Purchase access
              </ActionBtn>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export default function FangornUI({
  mode: initialMode = "browse",
  schemas,
  schemaDetail,
  dataEntries,
  querySchemaName,
}) {
  const [mode, setMode] = useState(initialMode);
  const [key, setKey] = useState(0);
  const [activeSchemaName, setActiveSchemaName] = useState(querySchemaName || "");
  const [autoLoad, setAutoLoad] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setAutoLoad(false);
    setKey((k) => k + 1);
  };

  const handleQuerySchema = (name) => {
    setActiveSchemaName(name);
    setAutoLoad(true);
    setMode("query");
    setKey((k) => k + 1);

    // Actually fetch data from the MCP server
    if (typeof sendPrompt === "function") {
      console.log(`Sending prompt: Query the first 40 data entries for schema "${name}". Use JSON response format.`)
      sendPrompt(`Query the first 40 data entries for schema "${name}". Use JSON response format.`);
    }
  };

  return (
    <div style={{ padding: "1.5rem 0 2rem" }}>
      <style>{`
        @keyframes fangornFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fangornBlink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>

      {/* Mode toggle */}
      <div
        style={{
          display: "flex", gap: 0, margin: "0 auto 20px",
          border: "0.5px solid var(--color-border-secondary, #2a2a2a)",
          borderRadius: 10, overflow: "hidden",
          background: "var(--color-background-secondary, #0e0e0e)",
        }}
      >
        {["browse", "query"].map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 500,
              background: mode === m ? "var(--color-background-primary, #141414)" : "transparent",
              border: "none", cursor: "pointer",
              color: mode === m ? "var(--color-text-primary, #fafafa)" : "var(--color-text-secondary, #8a8a8a)",
              borderRadius: mode === m ? 9 : 0,
              boxShadow: mode === m ? "0 0 0 0.5px var(--color-border-secondary, #2a2a2a)" : "none",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {m === "browse" ? "Browse schemas" : "Query data"}
          </button>
        ))}
      </div>

      {/* Content shell */}
      <div
        style={{
          background: "var(--color-background-secondary, #0e0e0e)",
          borderRadius: 20,
          border: "0.5px solid var(--color-border-secondary, #2a2a2a)",
          padding: 24, margin: "0 auto",
        }}
      >
        {mode === "browse" ? (
          <BrowseFlow
            key={`browse-${key}`}
            schemas={schemas || []}
            initialDetail={schemaDetail}
            onQuerySchema={handleQuerySchema}
          />
        ) : (
          <QueryFlow
            key={`query-${key}`}
            dataEntries={dataEntries || []}
            schemaName={activeSchemaName || ""}
            autoLoad={autoLoad}
          />
        )}
      </div>
    </div>
  );
}