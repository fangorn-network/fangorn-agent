"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Schema, FileEntry, ManifestState } from "../types/subgraph";
import { PAGE_SIZE, FETCH_BATCH, PREFETCH_BATCH } from "@/constants";
import { Bubble, TypingDots, ActionBtn, Pagination } from "./primitives";
import { SchemaCard, SchemaDetailCard } from "./Cards/SchemaCards";
import { ManifestCard } from "./Cards/ManifestCard";
import { FilterBar, applyFilters, ActiveFilter } from "./FilterBar";

interface FangornChatProps {
  schemas: Schema[];
  manifestData: ManifestState[];
  dataEntries: FileEntry[];
  sendMessage: (message: string) => void;
}

export default function FangornChat({
  schemas,
  manifestData,
  dataEntries,
  sendMessage,
}: FangornChatProps) {
  /* ── Schema browsing state ── */
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);
  const [schemaPage, setSchemaPage] = useState(1);

  /* ── Query state ── */
  const [querySchemaName, setQuerySchemaName] = useState("");
  const [querySubmitted, setQuerySubmitted] = useState(false);
  const [queryTyping, setQueryTyping] = useState(false);
  const [queryReady, setQueryReady] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [prefetchRequested, setPrefetchRequested] = useState(false);
  const [expandedManifest, setExpandedManifest] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<number, number | null>>({});
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const threadRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ── Scroll to bottom — uses an anchor element at the end of the thread ── */
  const scrollToBottom = useCallback((instant?: boolean) => {
    // Small delay lets React commit the DOM before we measure
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: instant ? "instant" : "smooth",
        block: "end",
      });
    }, 50);
  }, []);

  /* ── When manifest data arrives, stop typing and show results ── */
  useEffect(() => {
    if (manifestData.length > 0 && querySubmitted) {
      setQueryTyping(false);
      setQueryReady(true);
    }
  }, [manifestData, querySubmitted]);

  /* ── Auto-scroll when new content appears ── */
  useEffect(() => {
    scrollToBottom();
  }, [querySubmitted, queryTyping, queryReady, manifestData, scrollToBottom]);

  /* ── Scroll (instant) on pagination / expand changes ── */
  useEffect(() => {
    scrollToBottom(true);
  }, [selectedSchema, schemaPage, expandedManifest, currentPage, scrollToBottom]);

  /* ── Schema pagination ── */
  const SCHEMAS_PER_PAGE = 5;
  const totalSchemas = schemas.length;
  const totalSchemaPages = Math.max(1, Math.ceil(totalSchemas / SCHEMAS_PER_PAGE));
  const schemaPageStart = (schemaPage - 1) * SCHEMAS_PER_PAGE;
  const pageSchemas = schemas.slice(schemaPageStart, schemaPageStart + SCHEMAS_PER_PAGE);

  const handleSchemaPageChange = (page: number) => {
    if (page < 1 || page > totalSchemaPages) return;
    setSchemaPage(page);
    setSelectedSchema(null);
  };

  /* ── Handlers ── */

  const handleSelectSchema = (schema: Schema) => {
    setSelectedSchema((prev) => (prev?.name === schema.name ? null : schema));
  };

  const handleQuerySchema = (name: string) => {
    setQuerySchemaName(name);
    setQuerySubmitted(true);
    setQueryTyping(true);
    setQueryReady(false);
    setCurrentPage(1);
    setExpandedManifest(null);
    setSelectedFiles({});
    setPrefetchRequested(false);
    setFilterText("");
    setActiveFilters([]);
    sendMessage(
      `Query the first ${FETCH_BATCH} files whose manifest declares they conform to the schema "${name}". Use JSON response format.`
    );
  };

  const handleBackToBrowse = () => {
    setQuerySchemaName("");
    setQuerySubmitted(false);
    setQueryTyping(false);
    setQueryReady(false);
    setSelectedSchema(null);
    setFilterText("");
    setCurrentPage(1);
    setExpandedManifest(null);
    setSelectedFiles({});
    setActiveFilters([]);
    scrollToBottom(true);
  };

  const handleFilterSubmit = () => {
    if (!filterText.trim() || !querySchemaName) return;
    sendMessage(
      `Query data for schema "${querySchemaName}" where ${filterText}. Use JSON response format.`
    );
  };

  const handleLoadAll = () => {
    if (!querySchemaName) return;
    sendMessage(
      `Query the first ${FETCH_BATCH} data entries for schema "${querySchemaName}". Use JSON response format.`
    );
  };

  /* ── Filtered data + Pagination ── */
  const filteredManifests = applyFilters(manifestData, activeFilters);
  const totalManifests = filteredManifests.length;
  const totalPages = Math.max(1, Math.ceil(totalManifests / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageManifests = filteredManifests.slice(pageStart, pageStart + PAGE_SIZE);

  // Reset to page 1 when filters change
  const handleFiltersChange = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setCurrentPage(1);
    setExpandedManifest(null);
    setSelectedFiles({});
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setExpandedManifest(null);
    setSelectedFiles({});
    if (page >= totalPages - 1 && !prefetchRequested && totalManifests >= FETCH_BATCH) {
      setPrefetchRequested(true);
      sendMessage(
        `Fetch next ${PREFETCH_BATCH} data entries for schema "${querySchemaName}" starting from offset ${totalManifests}. Use JSON response format. Append them to the current results.`
      );
    }
  };

  const handleFileSelect = (manifestIndex: number, fileIndex: number | null) => {
    setSelectedFiles((prev) => ({ ...prev, [manifestIndex]: fileIndex }));
  };

  return (
    <div style={{ padding: "1.5rem 0 2rem" }}>
      <style>{`
        @keyframes fangornFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fangornBlink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>

      <div
        ref={threadRef}
        style={{
          background: "var(--color-background-secondary, #0e0e0e)",
          borderRadius: 20,
          border: "0.5px solid var(--color-border-secondary, #2a2a2a)",
          padding: 24,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 320,
          maxHeight: "75vh",
          overflowY: "auto",
        }}
      >
        {/* ═══════════════════════════════════════════
            SECTION 1 — Schema browsing
            ═══════════════════════════════════════════ */}
        <Bubble role="claude">
          Here are the schemas registered on the subgraph. Select one to inspect its field definitions.
        </Bubble>

        {schemas.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              animation: "fangornFadeIn 0.3s ease-out",
            }}
          >
            <Bubble role="claude">
              Found {schemas.length} schema{schemas.length !== 1 ? "s" : ""}
              {totalSchemaPages > 1 && <> — showing page {schemaPage} of {totalSchemaPages}</>}.
              Click one to inspect:
            </Bubble>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4, width: "100%" }}>
              {pageSchemas.map((s) => {
                const latestVersion = s.versions?.[s.versions.length - 1];
                const fieldCount = latestVersion?.fields?.length || 0;
                const isSelected = selectedSchema?.name === s.name;
                return (
                  <div key={s.name}>
                    <SchemaCard
                      schema={s}
                      fieldCount={fieldCount}
                      selected={isSelected}
                      onSelect={() => handleSelectSchema(s)}
                    />
                    {isSelected && (
                      <div style={{ animation: "fangornFadeIn 0.3s ease-out", marginTop: 8 }}>
                        <SchemaDetailCard schema={s} />
                        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                          <ActionBtn onClick={() => handleQuerySchema(s.name)}>
                            Query data for this schema
                          </ActionBtn>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalSchemaPages > 1 && (
              <Pagination
                currentPage={schemaPage}
                totalPages={totalSchemaPages}
                onPageChange={handleSchemaPageChange}
              />
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            SECTION 2 — Query results (appears below schemas)
            ═══════════════════════════════════════════ */}
        {querySubmitted && (
          <>
            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "linear-gradient(90deg, transparent, var(--color-border-primary, #3a3a3a), transparent)",
                margin: "8px 0",
              }}
            />

            <Bubble role="user">
              Show me data for{" "}
              <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
                {querySchemaName}
              </span>
            </Bubble>

            {queryTyping && <TypingDots />}

            {queryReady && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  animation: "fangornFadeIn 0.3s ease-out",
                }}
              >
                <Bubble role="claude">
                  {totalManifests === 0
                    ? activeFilters.length > 0
                      ? "No manifests match the current filters."
                      : "No records found for this query."
                    : (
                      <>
                        {activeFilters.length > 0
                          ? <>Showing {totalManifests} of {manifestData.length} manifest{manifestData.length !== 1 ? "s" : ""} (filtered)</>
                          : <>Found {totalManifests} manifest{totalManifests !== 1 ? "s" : ""}</>
                        }.
                        {" "}Page {currentPage} of {totalPages}:
                      </>
                    )}
                </Bubble>

                <FilterBar
                  manifestData={manifestData}
                  activeFilters={activeFilters}
                  onFiltersChange={handleFiltersChange}
                />

                {pageManifests.length > 0 && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, width: "100%" }}>
                      {pageManifests.map((ms, i) => {
                        const globalIdx = pageStart + i;
                        return (
                          <ManifestCard
                            key={ms.id || globalIdx}
                            index={globalIdx}
                            manifestState={ms}
                            isExpanded={expandedManifest === globalIdx}
                            onToggle={() =>
                              setExpandedManifest(expandedManifest === globalIdx ? null : globalIdx)
                            }
                            selectedFileIndex={selectedFiles[globalIdx] ?? null}
                            onFileSelect={(fileIdx) => handleFileSelect(globalIdx, fileIdx)}
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

                {/* Filter / refine input */}
                <div style={{ marginTop: 4, animation: "fangornFadeIn 0.3s ease-out" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "stretch",
                      background: "var(--color-background-primary, #141414)",
                      border: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
                      borderRadius: 10,
                      padding: 4,
                    }}
                  >
                    <input
                      type="text"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          filterText.trim() ? handleFilterSubmit() : handleLoadAll();
                        }
                      }}
                      placeholder='Refine: e.g. "genre is Lo-Fi"'
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        fontSize: 13,
                        padding: "6px 8px",
                        background: "transparent",
                        color: "var(--color-text-primary, #fafafa)",
                      }}
                    />
                    <ActionBtn small onClick={handleFilterSubmit} disabled={!filterText.trim()}>
                      Query
                    </ActionBtn>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-tertiary, #5a5a5a)",
                      marginTop: 4,
                      paddingLeft: 4,
                    }}
                  >
                    Describe a filter to narrow results
                  </div>
                </div>

                {/* Back to browse button */}
                <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
                  <ActionBtn onClick={handleBackToBrowse}>
                    ← Browse schemas
                  </ActionBtn>
                </div>
              </div>
            )}
          </>
        )}

        {/* Scroll anchor — always at the very bottom of the thread */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}