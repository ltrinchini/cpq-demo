import type Decimal from "decimal.js";

// Fixed lists: the visitor edits their values in the settings, not their contents.

export const ORIGINS = [
  "ethiopia-yirgacheffe",
  "colombia-huila",
  "brazil-cerrado",
  "guatemala-antigua",
  "kenya-nyeri",
] as const;
export type OriginId = (typeof ORIGINS)[number];

export const ROAST_PROFILES = ["light", "medium", "dark"] as const;
export type RoastProfile = (typeof ROAST_PROFILES)[number];

export const GRINDS = ["whole", "espresso", "filter"] as const;
export type Grind = (typeof GRINDS)[number];

export const BAG_SIZES = ["250g", "1kg", "5kg"] as const;
export type BagSize = (typeof BAG_SIZES)[number];

export const STATIONS = ["roasting", "grinding", "packing"] as const;
export type Station = (typeof STATIONS)[number];

export const CURRENCIES = ["CAD", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];
export type ForeignCurrency = Exclude<Currency, "CAD">;

// In the order of the price breakdown bar, from green coffee to margin.
export const COST_LINES = [
  "greenCoffee",
  "packaging",
  "labor",
  "overhead",
  "margin",
] as const;
export type CostLine = (typeof COST_LINES)[number];

/** Visitor settings. Percentages are fractions (0.35 for 35%). */
export interface PricingSettings {
  greenCoffeeUsdPerKg: Record<OriginId, Decimal>;
  roastProfiles: Record<
    RoastProfile,
    { lossRate: Decimal; cycleMinutes: Decimal }
  >;
  /** Green coffee kg per batch. */
  roasterCapacityKg: Decimal;
  /** Minutes per roasted kg. */
  grindMinutesPerKg: Record<Grind, Decimal>;
  bagSizes: Record<
    BagSize,
    {
      /** Roasted kg per bag. Fixed by the bag size, not editable. */
      weightKg: Decimal;
      packagingCostCad: Decimal;
      /** Minutes per bag. */
      packingMinutes: Decimal;
    }
  >;
  hourlyRatesCad: Record<Station, Decimal>;
  /** Fraction of direct costs. */
  overheadRate: Decimal;
  /** Fraction of the selling price. */
  marginRate: Decimal;
  /** CAD per 1 unit of the foreign currency. */
  exchangeRatesCad: Record<ForeignCurrency, Decimal>;
}

export interface Configuration {
  originId: OriginId;
  roast: RoastProfile;
  grind: Grind;
  bagSize: BagSize;
  /** Number of bags, integer. */
  quantity: number;
  currency: Currency;
}

export interface PriceDetails {
  roastedKg: Decimal;
  greenCoffeeKg: Decimal;
  batches: Decimal;
  labor: Record<Station, { minutes: Decimal; costCad: Decimal }>;
  /** Unrounded costs in CAD. */
  costsCad: {
    greenCoffee: Decimal;
    packaging: Decimal;
    labor: Decimal;
    directCosts: Decimal;
    overhead: Decimal;
    totalCost: Decimal;
    sellingPrice: Decimal;
  };
  /** Rates applied to this configuration. */
  rates: {
    greenCoffeeUsdPerKg: Decimal;
    usdRate: Decimal;
    /** CAD per 1 unit of the quote currency (1 for CAD). */
    quoteCurrencyRate: Decimal;
    lossRate: Decimal;
    cycleMinutes: Decimal;
    roasterCapacityKg: Decimal;
    grindMinutesPerKg: Decimal;
    bagWeightKg: Decimal;
    packagingCostCad: Decimal;
    packingMinutes: Decimal;
    hourlyRatesCad: Record<Station, Decimal>;
    overheadRate: Decimal;
    marginRate: Decimal;
  };
}

export interface PriceResult {
  currency: Currency;
  unitPrice: Decimal;
  total: Decimal;
  pricePerKg: Decimal;
  markup: Decimal;
  /** In the quote currency; they add up exactly to `total`. */
  lines: Record<CostLine, Decimal>;
  details: PriceDetails;
}
