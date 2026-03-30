'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FangornLogo } from "../../public/svg/fangorn-logo"

const PenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </svg>
);

const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const ThumbsUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);

const ThumbsDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V2" />
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

export default function ChatArea({
  messages,
  onSendMessage,
  sidebarOpen,
  onToggleSidebar,
  isNewChat,
}: any) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<any | null>(null);
  const textareaRef = useRef<any | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 relative">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          {!sidebarOpen && (
            <button
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="New chat"
            >
              <PenIcon />
            </button>
          )}
        </div>
        <a
          href="/explore"
          className="px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Explore subgraph →
        </a>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isNewChat ? (
          <NewChatView />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((msg: any, i: any) => (
              <Message key={i} message={msg} onSendMessage={onSendMessage} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl border shadow-sm transition-shadow focus-within:shadow-md"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-end gap-2 p-3">
              <button
                className="p-1.5 rounded-lg transition-colors flex-shrink-0 mb-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <PaperclipIcon />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to your agent..."
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed min-h-[24px] max-h-[200px]"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="p-2 rounded-xl flex-shrink-0 mb-0.5 transition-all"
                style={{
                  backgroundColor: input.trim() ? 'var(--accent)' : 'var(--border)',
                  color: input.trim() ? 'var(--color-black)' : 'var(--text-secondary)',
                }}
              >
                <SendIcon />
              </button>
            </div>
          </div>
          <p
            className="text-center text-xs mt-2"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            Your agent can make mistakes. Please double-check responses.
          </p>
        </div>
      </div>
    </main>
  );
}

function NewChatView() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="mb-8">
<div
  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 p-1.5"
  style={{ backgroundColor: 'var(--color-black)', color: 'var(--color-white)' }}
>
  <FangornLogo />
</div>
      </div>
      <h1
        className="text-2xl font-medium mb-2"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        How can I help you today?
      </h1>
      <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
        Ask your agent anything
      </p>
    </div>
  );
}

function Message({ message, onSendMessage }: any) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`mb-6 message-appear`}>
      <div className="flex gap-3">
        {isAssistant ? (
<div
  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 p-1.5"
  style={{ backgroundColor: 'var(--color-black)', color: 'var(--color-white)' }}
>
  <FangornLogo />
</div>
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium"
            style={{ backgroundColor: 'var(--border)', color: 'var(--color-white)' }}
          >
            U
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            {isAssistant ? 'Fangorn' : 'You'}
          </div>
          <div className="markdown-body text-sm leading-relaxed">
            {isAssistant ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            ) : (
              <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
            )}
          </div>

          {isAssistant && (
            <div className="flex items-center gap-1 mt-2">
              {[
                { icon: <CopyIcon />, title: 'Copy' },
                { icon: <ThumbsUpIcon />, title: 'Good response' },
                { icon: <ThumbsDownIcon />, title: 'Bad response' },
              ].map(({ icon, title }) => (
                <button
                  key={title}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  title={title}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="mb-6 message-appear">
      <div className="flex gap-3">
<div
  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 p-1.5"
  style={{ backgroundColor: 'var(--color-black)', color: 'var(--color-white)' }}
>
  <FangornLogo />
</div>
        <div className="flex-1">
          <div
            className="text-xs font-medium mb-2"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            Fangorn
          </div>
          <div className="flex gap-1.5 py-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="typing-dot w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--text-secondary)' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}