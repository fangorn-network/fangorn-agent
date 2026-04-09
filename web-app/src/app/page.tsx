'use client';

import { useEffect, useRef } from 'react';
import { FangornLogo } from '../../public/svg/fangorn-logo';
import { useFangornAgent } from '@/hooks/useFangornAgent';
import FangornChat from '@/components/FangornChat';

export default function ExplorePage() {
  const { chatHistory, loading, error, sendMessage } = useFangornAgent();
  const hasSent = useRef(false);

  // On mount, send the capability prompt exactly once (ref survives strict mode)
  useEffect(() => {
    if (!hasSent.current) {
      hasSent.current = true;
      sendMessage(
        'Briefly describe your capabilities with the Fangorn Network MCP server. ' +
        'Keep it concise — 2-5 sentences. Treat this as a greeting for someone who just joined. ' +
        'Do not directly mention the MCP server, these are YOUR capabilities. ' +
        'It is not strictly a data marketplace, and try to keep technical jargon out of the greeting.' +
        'Get the first 100 schemas.' ,
        { silent: true }
      );
    }
  }, [sendMessage]);

  // Show chat once we have at least one entry (the LLM response)
  const hasResponse = chatHistory.length > 0;

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

        <div className="flex items-center gap-3">
          {chatHistory.some((e) => e.resultType === "schemas") ? null : (
            <button
              onClick={() =>
                sendMessage("Retrieve all schemas.")
              }
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                color: loading ? 'var(--text-secondary)' : 'var(--text-primary)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-body)',
                background: 'transparent',
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Load schemas
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-4xl mx-auto px-8 py-8 w-full flex-1 flex flex-col min-h-0">
          {!hasResponse ? (
            /* ── Splash screen with animated logo ── */
            <div className="flex-1 flex flex-col items-center justify-center">
              <style>{`
                @keyframes fangornPulse {
                  0%, 100% { opacity: 0.4; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.08); }
                }
                @keyframes fangornSpin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes fangornFadeIn {
                  from { opacity: 0; transform: translateY(8px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  backgroundColor: 'var(--color-black)',
                  border: '1px solid var(--border)',
                  animation: 'fangornPulse 2s ease-in-out infinite',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: -6,
                    borderRadius: '50%',
                    border: '1px solid transparent',
                    borderTopColor: 'var(--text-secondary)',
                    animation: 'fangornSpin 2s linear infinite',
                    opacity: 0.4,
                  }}
                />
                <FangornLogo />
              </div>

              <p
                style={{
                  marginTop: 24,
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  animation: 'fangornFadeIn 0.6s ease-out 0.3s both',
                }}
              >
                Waking the forest...
              </p>
            </div>
          ) : (
            /* ── Chat interface ── */
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