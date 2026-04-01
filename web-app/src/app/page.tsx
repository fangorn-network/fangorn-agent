'use client';

import { useState, useRef, useEffect } from 'react';
import ChatArea from '../components/ChatArea';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState<any[]>([]);

  const handleSendMessage = async (content: any) => {
    const newMessages: any[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!res.ok) {
        throw new Error(`Agent returned ${res.status}`);
      }

      const data = await res.json();
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.response,
          mcpResults: data.mcpResults,
        },
      ]);
    } catch (err) {
      console.error('Fangorn Agent error:', err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I was unable to reach the Fangorn Agent. Make sure it is running and accessible.',
        },
      ]);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isNewChat={!activeConversation && messages.length === 0}
      />
    </div>
  );
}