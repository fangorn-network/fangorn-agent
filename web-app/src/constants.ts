// ─── Pagination constants ───────────────────────────────────
export const PAGE_SIZE = 5;
export const FETCH_BATCH = 40;
export const PREFETCH_BATCH = 30;

// ─── Accent & palette ───────────────────────────────────────
export const ACCENT = "#378ADD";
export const ACCENT_BG = "#0f2a4a";
export const ACCENT_DARK = "#5aa3e8";

// ─── Type → pill color map ──────────────────────────────────
export const typeColor = (t: string) => {
  if (t === "encrypted") return { bg: "#3d2e0e", fg: "#e8b84a" };
  if (t === "string") return { bg: "#0f2a4a", fg: "#5aa3e8" };
  if (t === "number" || t === "integer") return { bg: "#1a3310", fg: "#7ec860" };
  return { bg: "#2a1f4a", fg: "#a98be8" };
};
