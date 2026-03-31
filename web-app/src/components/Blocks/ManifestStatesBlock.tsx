import { useState } from "react";
import { ManifestState } from "../../types/subgraph";
import { PAGE_SIZE } from "@/constants";
import { Bubble, Pagination } from "../primitives";
import { ManifestCard } from "../Cards/ManifestCard";
import { FilterBar, applyFilters, ActiveFilter } from "../FilterBar";

interface ManifestStatesBlockProps {
  manifests: ManifestState[];
}

export const ManifestStatesBlock = ({ manifests }: ManifestStatesBlockProps) => {
  if (!manifests.length) return null;
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<number, number | null>>({});

  const filtered = applyFilters(manifests, activeFilters);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const handleFiltersChange = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setCurrentPage(1);
    setExpanded(null);
    setSelectedFiles({});
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fangornFadeIn 0.3s ease-out" }}>
      <Bubble role="system">
        {filtered.length === 0
          ? activeFilters.length > 0 ? "No manifests match the current filters." : "No records found."
          : (
            <>
              {activeFilters.length > 0
                ? <>Showing {filtered.length} of {manifests.length} manifest{manifests.length !== 1 ? "s" : ""} (filtered)</>
                : <>Found {filtered.length} manifest{filtered.length !== 1 ? "s" : ""}</>
              }. Page {currentPage} of {totalPages}:
            </>
          )}
      </Bubble>
      <FilterBar manifestData={manifests} activeFilters={activeFilters} onFiltersChange={handleFiltersChange} />
      {pageItems.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, width: "100%" }}>
            {pageItems.map((ms, i) => {
              const globalIdx = pageStart + i;
              return (
                <ManifestCard key={ms.id || globalIdx} index={globalIdx} manifestState={ms}
                  isExpanded={expanded === globalIdx}
                  onToggle={() => setExpanded(expanded === globalIdx ? null : globalIdx)}
                  selectedFileIndex={selectedFiles[globalIdx] ?? null}
                  onFileSelect={(fi) => setSelectedFiles(prev => ({ ...prev, [globalIdx]: fi }))} />
              );
            })}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages}
            onPageChange={(p) => { setCurrentPage(p); setExpanded(null); setSelectedFiles({}); }} />
        </>
      )}
    </div>
  );
};