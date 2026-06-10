import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/api";

export interface OllamaModel {
  name: string;
  parameterSize?: string;
  size?: number;
}

export interface UseModelsReturn {
  /** Models available from the local Ollama install */
  models: OllamaModel[];
  /** The model the agent is currently using */
  current: string | null;
  /** Whether a model switch is in flight */
  switching: boolean;
  loading: boolean;
  error: string | null;
  /** Switch the agent to a different model */
  switchModel: (model: string) => Promise<void>;
}

export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/models`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data: { current: string; models: OllamaModel[] }) => {
        setModels(data.models);
        setCurrent(data.current);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load models:", err);
        setError("Could not load models.");
        setLoading(false);
      });
  }, []);

  const switchModel = useCallback(
    async (model: string) => {
      if (model === current) return;
      setSwitching(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/model`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model }),
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setCurrent(data.current);
      } catch (err) {
        console.error("Failed to switch model:", err);
        setError("Could not switch model.");
      } finally {
        setSwitching(false);
      }
    },
    [current],
  );

  return { models, current, switching, loading, error, switchModel };
}
