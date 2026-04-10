import { SendOptions } from "@/hooks/useFangornAgent";
import { createContext, useContext, useState } from "react";

interface ChatContextValue {
  sendMessage: (message: string, options?: SendOptions) => void;
}

const ChatContext = createContext<ChatContextValue>({
  sendMessage: () => {},
});

export const ChatProvider = ChatContext.Provider;

export function useChatContext() {
  return useContext(ChatContext);
}

export interface CardChatConfig {
  /** Build the context object sent with the message */
  buildContext: () => Record<string, unknown>;
	dataContext?: string;
  /** Label shown in the chat thread, e.g. "Re: Schema Foo" */
  contextLabel: string;
  /** "schema" | "manifest" | "file" etc. */
  contextType: "schema" | "manifest" | "file" | undefined;
  /** Placeholder text for the input */
  placeholder?: string;
}


/* ═══════════════════════════════════════════════════════════
   CardChatInput (internal — rendered by BaseCard when chat is set)
   ═══════════════════════════════════════════════════════════ */

export const CardChatInput = ({
  chat,
  onChatSent,
}: {
  chat: CardChatConfig;
  onChatSent?: () => void;
}) => {
  const [value, setValue] = useState("");
  const { sendMessage } = useChatContext();

  const submit = () => {
    if (!value.trim()) return;
    const dataContext = chat.buildContext();
		const dataContextString = JSON.stringify(dataContext)
    sendMessage(
      `In regards to the ${chat.contextType} ${dataContextString}: ${value}`,
      {
        contextLabel: chat.contextLabel,
        contextType: chat.contextType,
        displayMessage: value,
				dataContext: dataContextString
      }
    );
    setValue("");
    onChatSent?.();
  };

  return (
    <div
      style={{
        marginTop: 8,
        paddingTop: 8,
        borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          background: "var(--color-background-secondary, #0e0e0e)",
          border: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
          borderRadius: 8,
          padding: 4,
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={chat.placeholder ?? `Ask about this ${chat.contextType}...`}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 12,
            padding: "5px 6px",
            background: "transparent",
            color: "var(--color-text-primary, #fafafa)",
            fontFamily: "var(--font-body, sans-serif)",
          }}
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          style={{
            border: "none",
            background: value.trim()
              ? "var(--color-text-primary, #fafafa)"
              : "var(--color-border-tertiary, #1e1e1e)",
            color: value.trim()
              ? "var(--color-background-primary, #141414)"
              : "var(--color-text-tertiary, #5a5a5a)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            cursor: value.trim() ? "pointer" : "default",
            transition: "background 0.15s, color 0.15s",
            fontFamily: "var(--font-body, sans-serif)",
          }}
        >
          ↵
        </button>
      </div>
    </div>
  );
};