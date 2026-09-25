import type {
  BagSize,
  Currency,
  Grind,
  OriginId,
  RoastProfile,
  Station,
} from "@/lib/pricing/types";

/** Human-readable labels for the fixed lists in `lib/pricing/types.ts`. */
export const ORIGIN_LABELS: Record<OriginId, string> = {
  "ethiopia-yirgacheffe": "Ethiopia Yirgacheffe",
  "colombia-huila": "Colombia Huila",
  "brazil-cerrado": "Brazil Cerrado",
  "guatemala-antigua": "Guatemala Antigua",
  "kenya-nyeri": "Kenya Nyeri",
};

export const ROAST_PROFILE_LABELS: Record<RoastProfile, string> = {
  light: "Light",
  medium: "Medium",
  dark: "Dark",
};

export const GRIND_LABELS: Record<Grind, string> = {
  whole: "Whole bean",
  espresso: "Espresso",
  filter: "Filter",
};

export const BAG_SIZE_LABELS: Record<BagSize, string> = {
  "250g": "250 g bag",
  "1kg": "1 kg bag",
  "5kg": "5 kg bag",
};

export const STATION_LABELS: Record<Station, string> = {
  roasting: "Roasting",
  grinding: "Grinding",
  packing: "Packing",
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  CAD: "Canadian dollar (CAD)",
  USD: "US dollar (USD)",
  EUR: "Euro (EUR)",
  GBP: "British pound (GBP)",
};
