import { useState } from "react";
import { Schema } from "../../types/subgraph";
import { Bubble, ActionBtn, Pagination } from "../primitives";
import { SchemaCard, SchemaDetailCard } from "../Cards/SchemaCards";

const ITEMS_PER_PAGE = 5;

interface SchemaBlockProps {
  schemas: Schema[];
  sendMessage: (m: string) => void;
}

export const SchemaBlock = ({ schemas, sendMessage }: SchemaBlockProps) => {
  const [selected, setSelected] = useState<Schema | null>(null);
  const [page, setPage] = useState(1);
  const [threadedSchemas, setThreadedSchemas] = useState<Set<string>>(new Set());

  const totalPages = Math.max(1, Math.ceil(schemas.length / ITEMS_PER_PAGE));
  const pageStart = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = schemas.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const handleChatSent = (schemaName: string) => {
    setThreadedSchemas((prev) => new Set(prev).add(schemaName));
    setSelected(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fangornFadeIn 0.3s ease-out" }}>
      <Bubble role="system">
        Found {schemas.length} schema{schemas.length !== 1 ? "s" : ""}
        {totalPages > 1 && <> — page {page} of {totalPages}</>}:
      </Bubble>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4, width: "100%" }}>
        {pageItems.map((s) => {
          const latestVersion = s.versions?.[s.versions.length - 1];
          const fieldCount = latestVersion?.fields?.length || 0;
          const isSelected = selected?.name === s.name;
          return (
            <div key={s.name}>
              <SchemaCard schema={s} fieldCount={fieldCount} selected={isSelected}
                hasSent={threadedSchemas.has(s.name)}
                onSelect={() => setSelected(prev => prev?.name === s.name ? null : s)} />
              {isSelected && (
                <div style={{ animation: "fangornFadeIn 0.3s ease-out", marginTop: 8 }}>
                  <SchemaDetailCard schema={s} onChatSent={() => handleChatSent(s.name)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages}
          onPageChange={(p) => { setPage(p); setSelected(null); }} />
      )}
    </div>
  );
};