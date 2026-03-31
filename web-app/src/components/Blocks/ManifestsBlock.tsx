import { useState } from "react";
import { Manifest } from "../../types/subgraph";
import { Bubble, Pagination } from "../primitives";
import { ManifestContentCard } from "../Cards/ManifestContentCard";

const ITEMS_PER_PAGE = 5;

interface ManifestsBlockProps {
  manifests: Manifest[];
}

export const ManifestsBlock = ({ manifests }: ManifestsBlockProps) => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(manifests.length / ITEMS_PER_PAGE));
  const pageStart = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = manifests.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fangornFadeIn 0.3s ease-out" }}>
      <Bubble role="system">
        Found {manifests.length} manifest{manifests.length !== 1 ? "s" : ""}
        {totalPages > 1 && <> — page {page} of {totalPages}</>}:
      </Bubble>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, width: "100%" }}>
        {pageItems.map((m, i) => {
          const globalIdx = pageStart + i;
          return (
            <ManifestContentCard key={m.id || globalIdx} manifest={m} index={globalIdx}
              isExpanded={expanded === globalIdx}
              onToggle={() => setExpanded(expanded === globalIdx ? null : globalIdx)} />
          );
        })}
      </div>
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages}
          onPageChange={(p) => { setPage(p); setExpanded(null); }} />
      )}
    </div>
  );
};