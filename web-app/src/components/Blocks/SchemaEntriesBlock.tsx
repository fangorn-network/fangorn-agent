import { BaseBlock, CardRenderContext } from "./BaseBlock";
import { SchemaEntriesCard } from "../Cards/SchemaEntriesCard";

interface SchemaEntriesBlockProps {
  entries: any[];
}

export const SchemaEntriesBlock = ({ entries }: SchemaEntriesBlockProps) => (
  <BaseBlock
    items={entries}
    pageSize={5}
    itemNoun="schema entry"
    itemNounPlural="schema entries"
    getKey={(e, i) => e.id || i}
    renderCard={(entry: any, ctx: CardRenderContext) => (
      <SchemaEntriesCard
        entry={entry}
        index={ctx.globalIndex}
        isExpanded={ctx.isExpanded}
        onToggle={ctx.toggleExpand}
      />
    )}
  />
);