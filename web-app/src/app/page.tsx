"use client";

import { useRef, useState } from "react";
import { ChatMode, useFangornAgent } from "@/hooks/useFangornAgent";
import FangornChat from "@/components/FangornChat";
import Splash from "../components/Splash";
import FangornHeader from "@/components/FangornHeader";
import { useToolboxSelection } from "@/hooks/useToolboxSelection";

export default function ExplorePage() {
  const toolbox = useToolboxSelection();
  const [chatMode, setChatMode] = useState<ChatMode>("tool-scoped");
  const toolNameListRef = useRef<string[]>(toolbox.selectedToolList);
  toolNameListRef.current = toolbox.selectedToolList;

  const chatModeRef = useRef<ChatMode>(chatMode);
  chatModeRef.current = chatMode;

  const { chatHistory, loading, error, sendMessage } = useFangornAgent({
    toolNameListRef,
    chatModeRef,
  });
  const hasSent = useRef(false);

  // On mount, send the capability prompt exactly once (ref survives strict mode)
  // useEffect(() => {
  // 	if (!hasSent.current) {
  // 		hasSent.current = true;
  // 		sendMessage(
  // 			'Briefly describe your capabilities with the Fangorn Network MCP server. ' +
  // 			'Keep it concise — 2-5 sentences. Treat this as a greeting for someone who just joined. ' +
  // 			'Do not directly mention the MCP server, these are YOUR capabilities. ' +
  // 			'Retrieve schemas with first=100. This is the maximum page size, not an expected count — ' +
  // 			'whatever comes back is the complete result. Do not paginate.',
  // 			{ silent: true }
  // 		);
  // 	}
  // }, [sendMessage]);

  // Show chat once we have at least one entry (the LLM response)
  // const hasResponse = chatHistory.length > 0;
  const hasResponse = true;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <FangornHeader />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-4xl mx-auto px-8 py-8 w-full flex-1 flex flex-col min-h-0">
          {!hasResponse ? (
            /* ── Splash screen with animated logo ── */
            <Splash />
          ) : (
            /* ── Chat interface ── */
            <FangornChat
              chatHistory={chatHistory}
              loading={loading}
              error={error}
              sendMessage={sendMessage}
              toolbox={toolbox}
              chatMode={chatMode}
              onChatModeChange={setChatMode}
            />
          )}
        </div>
      </main>
    </div>
  );
}
