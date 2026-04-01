import { createContext, useContext } from "react";

interface ChatContextValue {
  sendMessage: (message: string, options?: { silent?: boolean; contextLabel?: string; contextType?: string, displayMessage?: string }) => void;
}

const ChatContext = createContext<ChatContextValue>({
  sendMessage: () => {},
});

export const ChatProvider = ChatContext.Provider;

export function useChatContext() {
  return useContext(ChatContext);
}