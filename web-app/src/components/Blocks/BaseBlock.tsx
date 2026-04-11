import { useState, useCallback, ReactNode } from "react";
import { Bubble, Pagination } from "../primitives";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface BaseBlockProps<T> {
  /** The full unfiltered/unpaginated list of items */
  items: T[];
  /** Number of items per page (defaults to 5) */
  pageSize?: number;
  /** Singular noun for the item type, e.g. "schema", "manifest" */
  itemNoun: string;
  /** Plural noun — defaults to itemNoun + "s". Use for irregular plurals like "entries". */
  itemNounPlural?: string;
  /** Render a single card. Receives the item plus block-managed state. */
  renderCard: (item: T, ctx: CardRenderContext) => ReactNode;
  /** Extract a stable key from an item */
  getKey: (item: T, index: number) => string | number;
  /** Optional extra content above the card list (e.g. a FilterBar) */
  header?: ReactNode;
  /** If provided, shown as the count instead of items.length (useful when filtering) */
  displayCount?: number;
  /** Total count before filtering (for "X of Y" display) */
  totalCount?: number;
  /** Whether a filter is active — changes the summary text */
  isFiltered?: boolean;
  /** What to do when items is empty: "hidden" returns null, "message" shows a Bubble. Default: "hidden" */
  emptyBehavior?: "hidden" | "message";
  /** Called on page change — use for extra resets (e.g. clearing selectedFiles) */
  onPageChange?: () => void;
}

export interface CardRenderContext {
  /** Global index of this item in the full (filtered) list */
  globalIndex: number;
  /** Whether this card is the currently expanded one */
  isExpanded: boolean;
  /** Toggle expand for this card */
  toggleExpand: () => void;
}

/* ═══════════════════════════════════════════════════════════
   Hook: reusable pagination + expand state
   ═══════════════════════════════════════════════════════════ */

export function useBlockState<T>(items: T[], pageSize: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = items.slice(pageStart, pageStart + pageSize);

  const resetSelection = useCallback(() => {
    setExpandedIndex(null);
  }, []);

  const changePage = useCallback((page: number) => {
    setCurrentPage(page);
    setExpandedIndex(null);
  }, []);

  const toggleExpand = useCallback((globalIndex: number) => {
    setExpandedIndex((prev) => (prev === globalIndex ? null : globalIndex));
  }, []);

  const resetAll = useCallback(() => {
    setCurrentPage(1);
    setExpandedIndex(null);
  }, []);

  return {
    currentPage,
    totalPages,
    pageStart,
    pageItems,
    expandedIndex,
    changePage,
    toggleExpand,
    resetSelection,
    resetAll,
  };
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

export function BaseBlock<T>({
  items,
  pageSize = 5,
  itemNoun,
  itemNounPlural,
  renderCard,
  getKey,
  header,
  displayCount,
  totalCount,
  isFiltered = false,
  emptyBehavior = "hidden",
  onPageChange,
}: BaseBlockProps<T>) {
  const {
    currentPage,
    totalPages,
    pageStart,
    pageItems,
    expandedIndex,
    changePage,
    toggleExpand,
  } = useBlockState(items, pageSize);

  const count = displayCount ?? items.length;
  const pluralNoun = itemNounPlural ?? `${itemNoun}s`;
  const nounForCount = count !== 1 ? pluralNoun : itemNoun;

  // Early return when empty
  if (count === 0 && emptyBehavior === "hidden" && !isFiltered) return null;

  /* ── Summary text ── */
  const summaryContent = (() => {
    if (count === 0) {
      return isFiltered
        ? `No ${pluralNoun} match the current filters.`
        : "No records found.";
    }

    const countText =
      isFiltered && totalCount != null
        ? `Showing ${count} of ${totalCount} ${nounForCount} (filtered)`
        : `Found ${count} ${nounForCount}`;

    return (
      <>
        {countText}
        {totalPages > 1 && (
          <>
            {" "}— page {currentPage} of {totalPages}
          </>
        )}
        :
      </>
    );
  })();

  const handlePageChange = (page: number) => {
    changePage(page);
    onPageChange?.();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        animation: "fangornFadeIn 0.3s ease-out",
      }}
    >
      <Bubble role="system">{summaryContent}</Bubble>

      {header}

      {pageItems.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginTop: 4,
              width: "100%",
            }}
          >
            {pageItems.map((item, i) => {
              const globalIndex = pageStart + i;
              const ctx: CardRenderContext = {
                globalIndex,
                isExpanded: expandedIndex === globalIndex,
                toggleExpand: () => toggleExpand(globalIndex),
              };
              return (
                <div key={getKey(item, globalIndex)}>
                  {renderCard(item, ctx)}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}