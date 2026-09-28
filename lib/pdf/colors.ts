import type { CostLine } from "@/lib/pricing/types";

/**
 * PDF-only palette (`docs/design.md`, "PDF quote — Lantern Roasters"). Not
 * shared with the app's Tailwind tokens, which use a different palette.
 */
export const PDF_COLORS = {
  background: "#FFFFFF",
  ink: "#1C211E",
  slate: "#5A635D",
  frost: "#DDE2DE",
  roastBrown: "#3B2619",
  /** Accent for the total only; never used as text (below AA contrast). */
  goldenBean: "#C39A5E",
};

/** Roast scale, in the breakdown bar order (`docs/design.md`, "Roast scale"). */
export const PDF_COST_LINE_COLORS: Record<CostLine, string> = {
  greenCoffee: "#A9B98C",
  packaging: "#D8C6A1",
  labor: "#B0875A",
  overhead: "#7A5536",
  margin: "#3D2A1E",
};
