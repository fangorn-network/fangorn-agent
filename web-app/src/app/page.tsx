"use client";

import { useRef, useState } from "react";
import { ChatMode, useAgent } from "@/hooks/useAgent";
import CodingChat from "@/components/CodingChat";
import FangornHeader from "@/components/FangornHeader";
import { useToolboxSelection } from "@/hooks/useToolboxSelection";

export default function HomePage() {
  const toolbox = useToolboxSelection();
  const [chatMode, setChatMode] = useState<ChatMode>("tool-scoped");

  // Refs keep sendMessage stable while always reading the latest selection.
  const toolNameListRef = useRef<string[]>(toolbox.selectedToolList);
  toolNameListRef.current = toolbox.selectedToolList;

  const chatModeRef = useRef<ChatMode>(chatMode);
  chatModeRef.current = chatMode;

  const { chatHistory, loading, error, sendMessage } = useAgent({
    toolNameListRef,
    chatModeRef,
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <FangornHeader busy={loading} />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-4xl mx-auto px-8 py-8 w-full flex-1 flex flex-col min-h-0">
          <CodingChat
            chatHistory={chatHistory}
            loading={loading}
            error={error}
            sendMessage={sendMessage}
            toolbox={toolbox}
            chatMode={chatMode}
            onChatModeChange={setChatMode}
          />
        </div>
      </main>
    </div>
  );
}
