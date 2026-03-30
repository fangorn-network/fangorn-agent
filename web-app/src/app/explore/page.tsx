'use client';

import { useState } from 'react';
import FangornUI from '@/components/FangornUI';
import { FangornLogo } from '../../../public/svg/fangorn-logo';
import { useFangornAgent } from '@/hooks/useFangornAgent';

export default function ExplorePage() {
  const { loading, error, schemas, dataEntries, manifestData, sendMessage } = useFangornAgent();
  const [mode, setMode] = useState("browse");
   // Auto-load schemas on first visit
  const handleLoadSchemas = () => {
    console.log("Called handle load schemas")
    sendMessage('List all registered schemas. Use JSON response format.');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
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
            <p className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
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
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 message-appear">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="typing-dot w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--text-secondary)' }}
                  />
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                Querying subgraph...
              </span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              className="rounded-lg p-4 mb-6 text-sm message-appear"
              style={{
                background: '#2a1010',
                border: '1px solid #4a2020',
                color: '#e88',
                fontFamily: 'var(--font-body)',
              }}
            >
              {error}
            </div>
          )}

          {/* Empty state — show load button */}
          {schemas.length === 0 && !loading && (
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

          {schemas.length > 0 && (
            <FangornUI
              mode={mode}
              schemas={schemas}
              dataEntries={dataEntries}
              manifestData={manifestData}
              sendMessage={sendMessage}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ── Extraction helpers ───────────────────────────────────────────
// These try many paths to find the actual data from MCP responses.
// The MCP adapter may return: a string, a parsed object, content
// blocks wrapping text, etc. We try everything.

function deepParse(data: any): any {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return data; }
  }
  // MCP content blocks: [{ type: "text", text: "..." }]
  if (Array.isArray(data) && data.length > 0 && data[0]?.type === 'text' && data[0]?.text) {
    try { return JSON.parse(data[0].text); } catch { return data; }
  }
  // Single content block
  if (data?.type === 'text' && data?.text) {
    try { return JSON.parse(data.text); } catch { return data; }
  }
  // Nested content field
  if (data?.content) {
    return deepParse(data.content);
  }
  return data;
}

function findArray(data: any, ...keys: string[]): any[] | null {
  for (const key of keys) {
    if (data?.[key] && Array.isArray(data[key])) return data[key];
  }
  // Check one level deeper under 'data'
  if (data?.data) {
    for (const key of keys) {
      if (data.data[key] && Array.isArray(data.data[key])) return data.data[key];
    }
  }
  return null;
}

function extractSchemas(rawData: any): any[] {
  const data = deepParse(rawData);
  if (Array.isArray(data)) return data;
  const found = findArray(data, 'schemas', 'result', 'results', 'items');
  return found || [];
}

function extractDataEntries(rawData: any): { entries: any[]; schemaName: string } {
  const data = deepParse(rawData);
  let entries: any[] = [];
  let schemaName = '';

  if (Array.isArray(data)) {
    entries = data;
  } else {
    const found = findArray(data, 'entries', 'dataSources', 'result', 'results', 'items', 'data');
    entries = found || [];
  }

  // Try to pull schemaName from the first entry
  if (entries.length > 0) {
    schemaName = entries[0]?.schema_name || entries[0]?.schemaName || '';
  }

  return { entries, schemaName };
}