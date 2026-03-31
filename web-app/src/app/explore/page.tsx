'use client';

import { FangornLogo } from '../../../public/svg/fangorn-logo';
import { useFangornAgent } from '@/hooks/useFangornAgent';
import FangornChat from '@/components/FangornChat';

export default function ExplorePage() {
  const { chatHistory, loading, error, sendMessage } = useFangornAgent();

  const handleLoadSchemas = () => {
    sendMessage('List all registered schemas. Use JSON response format.');
  };

  const hasContent = chatHistory.length > 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center p-1.5"
            style={{ backgroundColor: 'var(--color-black)', border: '1px solid var(--border)' }}
          >
            <FangornLogo />
          </div>
          <div>
            <h1
              className="text-lg font-medium"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Explore
            </h1>
            <p
              className="text-xs"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
            >
              Browse schemas & query data on the Fangorn subgraph
            </p>
          </div>
        </div>

        <a
          href="/"
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-body)',
          }}
        >
          ← Back to chat
        </a>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Empty state — show load button */}
          {!hasContent && !loading && (
            <div className="flex flex-col items-center justify-center py-20 message-appear">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center p-2.5 mb-6"
                style={{ backgroundColor: 'var(--color-black)', border: '1px solid var(--border)' }}
              >
                <FangornLogo />
              </div>
              <h2
                className="text-xl font-medium mb-2"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Explore the subgraph
              </h2>
              <p
                className="text-sm mb-6 text-center max-w-sm"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
              >
                Browse registered schemas and query their data. Start by loading the available schemas.
              </p>
              <button
                onClick={handleLoadSchemas}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--color-black)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Load schemas
              </button>
            </div>
          )}

          {/* Chat — shown once there's any content or while loading the first request */}
          {(hasContent || loading) && (
            <FangornChat
              chatHistory={chatHistory}
              loading={loading}
              error={error}
              sendMessage={sendMessage}
            />
          )}
        </div>
      </main>
    </div>
  );
}