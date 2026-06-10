"use client";

import { useEffect, useState } from "react";
import { FangornLogo } from "../../public/svg/fangorn-logo";
import ModelSelector from "./ModelSelector";
import { API_URL } from "@/lib/api";

interface FangornHeaderProps {
  /** True while the agent is responding */
  busy?: boolean;
}

export default function FangornHeader({ busy }: FangornHeaderProps) {
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWorkspaceRoot(data?.workspaceRoot ?? null))
      .catch(() => setWorkspaceRoot(null));
  }, []);

  return (
    <header
      className="flex items-center justify-between px-6 py-4 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center p-1.5"
          style={{
            backgroundColor: "var(--color-black)",
            border: "1px solid var(--border)",
          }}
        >
          <FangornLogo />
        </div>
        <div>
          <h1
            className="text-lg font-medium"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            Fangorn Code
          </h1>
          <p
            className="text-xs"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono, monospace)",
            }}
            title="The workspace the agent works in"
          >
            {workspaceRoot ?? "Local coding agent powered by Ollama"}
          </p>
        </div>
      </div>
      <ModelSelector busy={busy} />
    </header>
  );
}
