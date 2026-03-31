import { useState } from "react";
import { Field } from "../../types/subgraph";
import { Bubble, Pagination } from "../primitives";
import { FieldCard } from "../Cards/FieldCard";

const ITEMS_PER_PAGE = 5;

interface FieldsBlockProps {
  fields: Field[];
}

export const FieldsBlock = ({ fields }: FieldsBlockProps) => {
  if (!fields.length) return null
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(fields.length / ITEMS_PER_PAGE));
  const pageStart = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = fields.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fangornFadeIn 0.3s ease-out" }}>
      <Bubble role="system">
        Found {fields.length} field{fields.length !== 1 ? "s" : ""}
        {totalPages > 1 && <> — page {page} of {totalPages}</>}:
      </Bubble>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, width: "100%" }}>
        {pageItems.map((f, i) => {
          const globalIdx = pageStart + i;
          return (
            <FieldCard key={f.id || globalIdx} field={f} index={globalIdx}
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