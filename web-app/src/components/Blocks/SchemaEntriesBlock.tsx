import { useState } from "react";
import { Bubble, Pagination } from "../primitives";
import { SchemaEntriesCard } from "../Cards/SchemaEntriesCard";

const ITEMS_PER_PAGE = 5;

interface SchemaEntriesBlockProps {
  entries: any[];
}

export const SchemaEntriesBlock = ({ entries }: SchemaEntriesBlockProps) => {
  if (!entries.length) return null;
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / ITEMS_PER_PAGE));
  const pageStart = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = entries.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fangornFadeIn 0.3s ease-out" }}>
      <Bubble role="system">
        Found {entries.length} schema entr{entries.length !== 1 ? "ies" : "y"}
        {totalPages > 1 && <> — page {page} of {totalPages}</>}:
      </Bubble>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, width: "100%" }}>
        {pageItems.map((entry, i) => {
          const globalIdx = pageStart + i;
          return (
            <SchemaEntriesCard key={entry.id || globalIdx} entry={entry} index={globalIdx}
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