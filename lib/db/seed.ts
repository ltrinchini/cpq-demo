import Decimal from "decimal.js";
import type { Configuration, PricingSettings } from "@/lib/pricing/types";

/**
 * Default settings for a new sandbox: fictional but realistic rates,
 * identical to the reference values in specs/001-pricing-engine/spec.md.
 * Never imported by `lib/pricing/`, which must not contain demo constants.
 */
export function defaultSettings(): PricingSettings {
  const d = (value: string) => new Decimal(value);

  return {
    greenCoffeeUsdPerKg: {
      "ethiopia-yirgacheffe": d("8.40"),
      "colombia-huila": d("7.20"),
      "brazil-cerrado": d("5.60"),
      "guatemala-antigua": d("7.80"),
      "kenya-nyeri": d("9.60"),
    },
    roastProfiles: {
      light: { lossRate: d("0.14"), cycleMinutes: d("16") },
      medium: { lossRate: d("0.16"), cycleMinutes: d("18") },
      dark: { lossRate: d("0.19"), cycleMinutes: d("21") },
    },
    roasterCapacityKg: d("15"),
    grindMinutesPerKg: { whole: d("0"), espresso: d("3"), filter: d("2") },
    bagSizes: {
      "250g": {
        weightKg: d("0.25"),
        packagingCostCad: d("0.85"),
        packingMinutes: d("0.5"),
      },
      "1kg": {
        weightKg: d("1"),
        packagingCostCad: d("1.60"),
        packingMinutes: d("0.75"),
      },
      "5kg": {
        weightKg: d("5"),
        packagingCostCad: d("3.50"),
        packingMinutes: d("1.5"),
      },
    },
    hourlyRatesCad: { roasting: d("32"), grinding: d("26"), packing: d("24") },
    overheadRate: d("0.15"),
    marginRate: d("0.35"),
    exchangeRatesCad: { USD: d("1.36"), EUR: d("1.50"), GBP: d("1.72") },
  };
}

/** Default configuration shown on the first visit and used for the sample quote. */
export function defaultConfiguration(): Configuration {
  return {
    originId: "ethiopia-yirgacheffe",
    roast: "medium",
    grind: "espresso",
    bagSize: "1kg",
    quantity: 24,
    currency: "CAD",
  };
}

/**
 * Fictional café names, used to prefill the customer name field so the
 * demo flow never starts from an empty screen.
 */
export const DEMO_CUSTOMER_NAMES = [
  "Maple & Bean Café",
  "The Daily Grind",
  "Harborview Coffee House",
  "Northside Espresso Bar",
  "Willow Street Café",
  "Sunrise Roasters Café",
  "The Corner Table",
  "Birchwood Coffee Co.",
] as const;

/** Quote validity, in days from its creation date. */
export const QUOTE_VALIDITY_DAYS = 30;
