import { useState } from "react";
import type { ManifestState } from "@fangorn-network/client-types";
import { PAGE_SIZE } from "@/constants";
import { BaseBlock, CardRenderContext } from "./BaseBlock";
import { ManifestCard } from "../Cards/ManifestCard";
import { FilterBar, applyFilters, ActiveFilter } from "../FilterBar";

interface ManifestStatesBlockProps {
  manifests: ManifestState[];
}

export const ManifestStatesBlock = ({ manifests }: ManifestStatesBlockProps) => {
  if (!manifests.length) return null;

  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Record<number, number | null>>({});

  const filtered = applyFilters(manifests, activeFilters);

  const handleFiltersChange = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setSelectedFiles({});
  };

  return (
    <BaseBlock
      items={filtered}
      pageSize={PAGE_SIZE}
      itemNoun="manifest"
      getKey={(ms, i) => ms.id || i}
      isFiltered={activeFilters.length > 0}
      totalCount={manifests.length}
      emptyBehavior="message"
      onPageChange={() => setSelectedFiles({})}
      header={
        <FilterBar
          manifestData={manifests}
          activeFilters={activeFilters}
          onFiltersChange={handleFiltersChange}
        />
      }
      renderCard={(ms: ManifestState, ctx: CardRenderContext) => (
        <ManifestCard
          index={ctx.globalIndex}
          manifestState={ms}
          isExpanded={ctx.isExpanded}
          onToggle={ctx.toggleExpand}
          selectedFileIndex={selectedFiles[ctx.globalIndex] ?? null}
          onFileSelect={(fi) =>
            setSelectedFiles((prev) => ({ ...prev, [ctx.globalIndex]: fi }))
          }
        />
      )}
    />
  );
};