import type { FileField } from "@fangorn-network/client-types";
import { BaseBlock, CardRenderContext } from "./BaseBlock";
import { FieldCard } from "../Cards/FieldCard";

interface FieldsBlockProps {
  fields: FileField[];
}

export const FieldsBlock = ({ fields }: FieldsBlockProps) => (
  <BaseBlock
    items={fields}
    pageSize={5}
    itemNoun="field"
    getKey={(f, i) => f.id || i}
    renderCard={(f: FileField, ctx: CardRenderContext) => (
      <FieldCard
        field={f}
        index={ctx.globalIndex}
        isExpanded={ctx.isExpanded}
        onToggle={ctx.toggleExpand}
      />
    )}
  />
);