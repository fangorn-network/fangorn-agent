import { useState, useEffect, useRef, useCallback } from "react";
import { Schema } from "../types/subgraph";
import { Bubble, TypingDots, ActionBtn } from "./primitives";
import { SchemaCard, SchemaDetailCard } from "./SchemaCards";

interface BrowseFlowProps {
  schemas: Schema[];
  initialDetail: Schema | null;
  onQuerySchema: (name: string) => void;
}

export const BrowseFlow = ({ schemas = [], initialDetail, onQuerySchema }: BrowseFlowProps) => {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [selected, setSelected] = useState<Schema | null>(initialDetail || null);
  const threadRef = useRef<HTMLDivElement>(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, 60);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setTyping(true), 800);
    const t3 = setTimeout(() => { setTyping(false); setStep(2); }, 1800);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  useEffect(scrollDown, [step, typing, selected, scrollDown]);

  const handleSelect = (schema: Schema) => {
    setSelected((prev) => (prev?.name === schema.name ? null : schema));
    if (!selected || selected.name !== schema.name) setStep(3);
  };

  return (
    <div ref={threadRef} style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 320, overflowY: "auto" }}>
      <Bubble role="claude">
        Here are the schemas registered on the subgraph. Select one to inspect its field definitions.
      </Bubble>
      {step >= 1 && <Bubble role="user">Show me what's registered.</Bubble>}
      {typing && <TypingDots />}
      {step >= 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fangornFadeIn 0.3s ease-out" }}>
          <Bubble role="claude">
            Found {schemas.length} schema{schemas.length !== 1 ? "s" : ""} — click one to inspect:
          </Bubble>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4, width: "100%" }}>
            {schemas.map((s) => {
              const latestVersion = s.versions?.[s.versions.length - 1];
              const fieldCount = latestVersion?.fields?.length || 0;
              const isSelected = selected?.name === s.name;
              return (
                <div key={s.name}>
                  <SchemaCard schema={s} fieldCount={fieldCount} selected={isSelected} onSelect={() => handleSelect(s)} />
                  {isSelected && (
                    <div style={{ animation: "fangornFadeIn 0.3s ease-out", marginTop: 8 }}>
                      <SchemaDetailCard schema={s} />
                      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                        <ActionBtn onClick={() => onQuerySchema(s.name)}>Query data for this schema</ActionBtn>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
