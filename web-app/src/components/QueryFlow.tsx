import { useState, useEffect, useRef, useCallback } from "react";
import { FileEntry } from "../types/subgraph";
import { PAGE_SIZE, FETCH_BATCH, PREFETCH_BATCH } from "@/constants";
import { Bubble, TypingDots, ActionBtn, Pagination } from "./primitives";
import { DataRecordCard } from "./DataRecordCard";

interface QueryFlowProps {
  dataEntries?: FileEntry[];
  schemaName?: string;
  autoLoad?: boolean;
  sendPrompt?: (message: string) => void;
}

export const QueryFlow = ({
  dataEntries = [],
  schemaName = "",
  autoLoad = false,
  sendPrompt,
}: QueryFlowProps) => {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [expandedFile, setExpandedFile] = useState<number | null>(null);
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
    if (dataEntries.length > 0 && submitted) {
      setTyping(false);
      setStep(2);
    }
  }, [dataEntries, submitted]);

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

  console.log(`data being returned to QueryFlow.tsx: ${JSON.stringify(dataEntries)}`)

  const totalFiles = dataEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalFiles / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageFiles = dataEntries.slice(pageStart, pageStart + PAGE_SIZE);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setExpandedFile(null);
    if (page >= totalPages - 1 && !prefetchRequested && totalFiles >= FETCH_BATCH) {
      setPrefetchRequested(true);
      if (sendPrompt) {
        sendPrompt(
          `Fetch next ${PREFETCH_BATCH} data entries for schema "${schemaName}" starting from offset ${totalFiles}. Use JSON response format. Append them to the current results.`
        );
      }
    }
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
            {totalFiles === 0 ? "No records found for this query." : <>Found {totalFiles} record{totalFiles !== 1 ? "s" : ""}. Showing page {currentPage} of {totalPages}:</>}
          </Bubble>
          {pageFiles.length > 0 && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, width: "100%" }}>
                {pageFiles.map((file, i) => {
                  // console.log(`Received File: ${JSON.stringify(file)}`)
                  const globalIdx = pageStart + i;
                  const isExpanded = expandedFile === globalIdx;
                  const plainFields = file.fields.filter((f) => f.acc === "plain");
                  const encFields = file.fields.filter((f) => f.acc !== "plain");
                  const summaryField = plainFields[0];
                  const secondaryField = plainFields.length > 1 ? plainFields[1] : undefined;
                  const totalEncPrice = encFields.reduce((sum, f) => sum + (f.price != null ? Number(f.price) : 0), 0);
                  return (
                    <DataRecordCard key={globalIdx} index={globalIdx} file={file} plainFields={plainFields} encFields={encFields}
                      summaryField={summaryField} secondaryField={secondaryField} totalEncPrice={totalEncPrice}
                      isExpanded={isExpanded} onToggle={() => setExpandedFile(isExpanded ? null : globalIdx)} />
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
