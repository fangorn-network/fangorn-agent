import { useState, useEffect, useRef, useCallback } from "react";
import { ManifestState } from "../types/subgraph";
import { PAGE_SIZE, FETCH_BATCH, PREFETCH_BATCH } from "@/constants";
import { Bubble, TypingDots, ActionBtn, Pagination } from "./primitives";
import { ManifestCard } from "./ManifestCard";

interface QueryFlowProps {
  manifestStates?: ManifestState[];
  schemaName?: string;
  autoLoad?: boolean;
  sendPrompt?: (message: string) => void;
}

export const QueryFlow = ({
  manifestStates = [],
  schemaName = "",
  autoLoad = false,
  sendPrompt,
}: QueryFlowProps) => {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [expandedManifest, setExpandedManifest] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<number, number | null>>({});
  const [filterText, setFilterText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [prefetchRequested, setPrefetchRequested] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, 60);
  }, []);

  useEffect(() => {
    if (manifestStates.length > 0 && submitted) {
      setTyping(false);
      setStep(2);
    }
  }, [manifestStates, submitted]);

  useEffect(() => {
    if (autoLoad && schemaName) {
      setSubmitted(true);
      setStep(1);
      setTyping(true);
    }
  }, [autoLoad, schemaName]);

  useEffect(scrollDown, [step, typing, expandedManifest, selectedFiles, currentPage, scrollDown]);

  const handleLoadAll = () => {
    if (!schemaName) return;
    setSubmitted(true);
    setStep(1);
    setTyping(true);
    setTimeout(() => { setTyping(false); setStep(2); }, 1400);
    if (sendPrompt) {
      sendPrompt(`Query the first ${FETCH_BATCH} data entries for schema "${schemaName}". Use JSON response format.`);
    }
  };

  const handleFilterSubmit = () => {
    if (!filterText.trim()) return;
    if (sendPrompt) {
      sendPrompt(`Query data for schema "${schemaName}" where ${filterText}. Use JSON response format.`);
    }
  };

  const totalManifests = manifestStates.length;
  const totalPages = Math.max(1, Math.ceil(totalManifests / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageManifests = manifestStates.slice(pageStart, pageStart + PAGE_SIZE);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setExpandedManifest(null);
    setSelectedFiles({});
    if (page >= totalPages - 1 && !prefetchRequested && totalManifests >= FETCH_BATCH) {
      setPrefetchRequested(true);
      if (sendPrompt) {
        sendPrompt(
          `Fetch next ${PREFETCH_BATCH} data entries for schema "${schemaName}" starting from offset ${totalManifests}. Use JSON response format. Append them to the current results.`
        );
      }
    }
  };

  const handleFileSelect = (manifestIndex: number, fileIndex: number | null) => {
    setSelectedFiles((prev) => ({ ...prev, [manifestIndex]: fileIndex }));
  };

  return (
    <div ref={threadRef} style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 320, overflowY: "auto" }}>
      {!submitted && (
        <>
          <Bubble role="claude">
            {schemaName ? (
              <>Ready to query <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}>{schemaName}</span>. You can load data directly or describe a filter first.</>
            ) : "Which schema would you like to query? You can browse schemas first to pick one."}
          </Bubble>
          {schemaName && (
            <div style={{ animation: "fangornFadeIn 0.3s ease-out" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "stretch", background: "var(--color-background-primary, #fff)", border: "0.5px solid var(--color-border-tertiary, #e0e0e0)", borderRadius: 10, padding: 4 }}>
                <input
                  type="text" value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (filterText.trim() ? handleFilterSubmit() : handleLoadAll())}
                  placeholder='e.g. "artist is FANGORN"'
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 13, padding: "6px 8px", background: "transparent", color: "var(--color-text-primary, #1a1a1a)" }}
                />
                {filterText.trim()
                  ? <ActionBtn small onClick={handleFilterSubmit}>Filter</ActionBtn>
                  : <ActionBtn small onClick={handleLoadAll}>Load all</ActionBtn>}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)", marginTop: 4, paddingLeft: 4 }}>
                Describe a field filter or click "Load all"
              </div>
            </div>
          )}
        </>
      )}

      {submitted && step >= 1 && (
        <Bubble role="user">
          {filterText.trim() ? `Query ${schemaName} where ${filterText}` : `Show me data for ${schemaName}`}
        </Bubble>
      )}

      {typing && <TypingDots />}

      {step >= 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fangornFadeIn 0.3s ease-out" }}>
          <Bubble role="claude">
            {totalManifests === 0
              ? "No records found for this query."
              : <>Found {totalManifests} manifest{totalManifests !== 1 ? "s" : ""}. Showing page {currentPage} of {totalPages}:</>}
          </Bubble>
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
                      onToggle={() => setExpandedManifest(expandedManifest === globalIdx ? null : globalIdx)}
                      selectedFileIndex={selectedFiles[globalIdx] ?? null}
                      onFileSelect={(fileIdx) => handleFileSelect(globalIdx, fileIdx)}
                    />
                  );
                })}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </>
          )}
          <div style={{ marginTop: 4, animation: "fangornFadeIn 0.3s ease-out" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "stretch", background: "var(--color-background-primary, #fff)", border: "0.5px solid var(--color-border-tertiary, #e0e0e0)", borderRadius: 10, padding: 4 }}>
              <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && filterText.trim() && handleFilterSubmit()}
                placeholder='Refine: e.g. "genre is Lo-Fi"'
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, padding: "6px 8px", background: "transparent", color: "var(--color-text-primary, #1a1a1a)" }} />
              <ActionBtn small onClick={handleFilterSubmit} disabled={!filterText.trim()}>Query</ActionBtn>
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