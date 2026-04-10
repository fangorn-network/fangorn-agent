import { useState } from "react";
import type { SchemaState } from "@fangorn-network/client-types";
import { BaseBlock, CardRenderContext } from "./BaseBlock";
import { SchemaCard, SchemaDetailCard } from "../Cards/SchemaCards";

interface SchemaBlockProps {
  schemaStates: SchemaState[];
}

export const SchemaBlock = ({ schemaStates: schemas }: SchemaBlockProps) => {
  const [threadedSchemas, setThreadedSchemas] = useState<Set<string>>(new Set());

  const handleChatSent = (schemaName: string) => {
    setThreadedSchemas((prev) => new Set(prev).add(schemaName));
  };

  return (
    <BaseBlock
      items={schemas}
      pageSize={5}
      itemNoun="schema"
      getKey={(s) => s.name}
      renderCard={(s: SchemaState, ctx: CardRenderContext) => {
        const versions = s.versions ?? [];
        const latestVersion = versions[versions.length - 1];
        const fieldCount = latestVersion?.fields?.length ?? 0;
        return (
          <>
            <SchemaCard
              schema={s}
              fieldCount={fieldCount}
              selected={ctx.isExpanded}
              hasSent={threadedSchemas.has(s.name)}
              onSelect={ctx.toggleExpand}
            />
            {ctx.isExpanded && (
              <div style={{ animation: "fangornFadeIn 0.3s ease-out", marginTop: 8 }}>
                <SchemaDetailCard
                  schema={s}
                  onChatSent={() => handleChatSent(s.name)}
                />
              </div>
            )}
          </>
        );
      }}
    />
  );
};