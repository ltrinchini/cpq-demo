import type {
  BagSize,
  ForeignCurrency,
  Grind,
  OriginId,
  PricingSettings,
  RoastProfile,
  Station,
} from "@/lib/pricing/types";

/** `PricingSettings`, with every `Decimal` leaf as the string a form field holds. */
export interface SettingsFormValues {
  greenCoffeeUsdPerKg: Record<OriginId, string>;
  roastProfiles: Record<
    RoastProfile,
    { lossRate: string; cycleMinutes: string }
  >;
  roasterCapacityKg: string;
  grindMinutesPerKg: Record<Grind, string>;
  bagSizes: Record<
    BagSize,
    { weightKg: string; packagingCostCad: string; packingMinutes: string }
  >;
  hourlyRatesCad: Record<Station, string>;
  overheadRate: string;
  marginRate: string;
  exchangeRatesCad: Record<ForeignCurrency, string>;
  quoteValidityDays: number;
}

export interface GreenCoffeeFormValues {
  greenCoffeeUsdPerKg: Record<OriginId, string>;
}

export interface RoastingFormValues {
  roastProfiles: Record<
    RoastProfile,
    { lossRate: string; cycleMinutes: string }
  >;
  roasterCapacityKg: string;
}

export interface PackagingFormValues {
  bagSizes: Record<
    BagSize,
    { weightKg: string; packagingCostCad: string; packingMinutes: string }
  >;
}

export interface LaborFormValues {
  hourlyRatesCad: Record<Station, string>;
  grindMinutesPerKg: Record<Grind, string>;
}

export interface OverheadMarginFormValues {
  overheadRate: string;
  marginRate: string;
}

export interface CurrenciesFormValues {
  exchangeRatesCad: Record<ForeignCurrency, string>;
}

export interface QuotesFormValues {
  quoteValidityDays: number;
}

function mapRecord<K extends string, V, R>(
  record: Record<K, V>,
  fn: (value: V) => R,
): Record<K, R> {
  return Object.fromEntries(
    (Object.entries(record) as [K, V][]).map(([key, value]) => [
      key,
      fn(value),
    ]),
  ) as Record<K, R>;
}

/**
 * Converts settings fetched from the database into the plain, string-leaf
 * values the settings forms edit. A `Decimal` instance can't be passed as a
 * prop from a Server Component to a Client Component, so this conversion
 * happens once, server-side, before the settings tree renders.
 */
export function toSettingsFormValues(
  settings: PricingSettings,
): SettingsFormValues {
  return {
    greenCoffeeUsdPerKg: mapRecord(settings.greenCoffeeUsdPerKg, (value) =>
      value.toString(),
    ),
    roastProfiles: mapRecord(settings.roastProfiles, (value) => ({
      lossRate: value.lossRate.toString(),
      cycleMinutes: value.cycleMinutes.toString(),
    })),
    roasterCapacityKg: settings.roasterCapacityKg.toString(),
    grindMinutesPerKg: mapRecord(settings.grindMinutesPerKg, (value) =>
      value.toString(),
    ),
    bagSizes: mapRecord(settings.bagSizes, (value) => ({
      weightKg: value.weightKg.toString(),
      packagingCostCad: value.packagingCostCad.toString(),
      packingMinutes: value.packingMinutes.toString(),
    })),
    hourlyRatesCad: mapRecord(settings.hourlyRatesCad, (value) =>
      value.toString(),
    ),
    overheadRate: settings.overheadRate.toString(),
    marginRate: settings.marginRate.toString(),
    exchangeRatesCad: mapRecord(settings.exchangeRatesCad, (value) =>
      value.toString(),
    ),
    quoteValidityDays: settings.quoteValidityDays,
  };
}
