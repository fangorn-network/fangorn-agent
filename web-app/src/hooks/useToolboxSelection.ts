import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/api";

export type ToolboxMap = Record<string, string[]>;

export interface UseToolboxSelectionReturn {
  /** Full map of toolbox name → tool names */
  toolboxMap: ToolboxMap;
  /** Set of currently selected tool names */
  selectedTools: Set<string>;
  /** Whether the map is still loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Toggle a single tool on/off */
  toggleTool: (toolName: string) => void;
  /** Select all tools in a toolbox */
  selectToolbox: (toolboxName: string) => void;
  /** Deselect all tools in a toolbox */
  deselectToolbox: (toolboxName: string) => void;
  /** Toggle an entire toolbox: if all selected → deselect all, else select all */
  toggleToolbox: (toolboxName: string) => void;
  /** Clear all selections */
  clearAll: () => void;
  /** Select everything */
  selectAll: () => void;
  /** Get the selected tool names as an array (for passing to the API) */
  selectedToolList: string[];
}

export function useToolboxSelection(): UseToolboxSelectionReturn {
  const [toolboxMap, setToolboxMap] = useState<ToolboxMap>({});
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/toolbox-map`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data: ToolboxMap) => {
        setToolboxMap(data);
        // Start with every tool enabled — the coding agent needs its
        // full toolset by default; users can still deselect.
        setSelectedTools(new Set(Object.values(data).flat()));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load toolbox map:", err);
        setError("Could not load available tools.");
        setLoading(false);
      });
  }, []);

  const toggleTool = useCallback((toolName: string) => {
    setSelectedTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolName)) {
        next.delete(toolName);
      } else {
        next.add(toolName);
      }
      return next;
    });
  }, []);

  const selectToolbox = useCallback(
    (toolboxName: string) => {
      const tools = toolboxMap[toolboxName];
      if (!tools) return;
      setSelectedTools((prev) => {
        const next = new Set(prev);
        tools.forEach((t) => next.add(t));
        return next;
      });
    },
    [toolboxMap],
  );

  const deselectToolbox = useCallback(
    (toolboxName: string) => {
      const tools = toolboxMap[toolboxName];
      if (!tools) return;
      setSelectedTools((prev) => {
        const next = new Set(prev);
        tools.forEach((t) => next.delete(t));
        return next;
      });
    },
    [toolboxMap],
  );

  const toggleToolbox = useCallback(
    (toolboxName: string) => {
      const tools = toolboxMap[toolboxName];
      if (!tools) return;
      const allSelected = tools.every((t) => selectedTools.has(t));
      if (allSelected) {
        deselectToolbox(toolboxName);
      } else {
        selectToolbox(toolboxName);
      }
    },
    [toolboxMap, selectedTools, selectToolbox, deselectToolbox],
  );

  const clearAll = useCallback(() => {
    setSelectedTools(new Set());
  }, []);

  const selectAll = useCallback(() => {
    const all = new Set<string>();
    Object.values(toolboxMap).forEach((tools) =>
      tools.forEach((t) => all.add(t)),
    );
    setSelectedTools(all);
  }, [toolboxMap]);

  return {
    toolboxMap,
    selectedTools,
    loading,
    error,
    toggleTool,
    selectToolbox,
    deselectToolbox,
    toggleToolbox,
    clearAll,
    selectAll,
    selectedToolList: Array.from(selectedTools),
  };
}
