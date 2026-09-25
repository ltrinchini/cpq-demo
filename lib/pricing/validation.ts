import Decimal from "decimal.js";
import { z } from "zod";
import {
  BAG_SIZES,
  CURRENCIES,
  GRINDS,
  ORIGINS,
  ROAST_PROFILES,
  STATIONS,
  type Configuration,
  type PricingSettings,
} from "./types";

export const MAX_QUANTITY = 10_000;

/**
 * Accepts a number, a numeric string (form fields, Postgres `numeric`
 * columns) or a Decimal, and outputs a finite Decimal.
 */
function decimal(label: string) {
  return z
    .union([z.number(), z.string(), z.instanceof(Decimal)], {
      error: `${label} must be a number`,
    })
    .transform((value, ctx) => {
      try {
        const result = new Decimal(value);
        if (result.isFinite()) return result;
      } catch {
        // Invalid string: reported below.
      }
      ctx.addIssue({ code: "custom", message: `${label} must be a number` });
      return z.NEVER;
    });
}

/** Strictly greater than 0. */
function positive(label: string) {
  return decimal(label).refine((value) => value.gt(0), {
    error: `${label} must be greater than 0`,
  });
}

/** Greater than or equal to 0. */
function nonNegative(label: string) {
  return decimal(label).refine((value) => value.gte(0), {
    error: `${label} must be 0 or more`,
  });
}

/** Fraction from 0 inclusive to 1 exclusive, shown as a percentage. */
function rate(label: string) {
  return decimal(label)
    .refine((value) => value.gte(0), { error: `${label} must be 0% or more` })
    .refine((value) => value.lt(1), {
      error: `${label} must be less than 100%`,
    });
}

export const pricingSettingsSchema = z.object({
  greenCoffeeUsdPerKg: z.record(
    z.enum(ORIGINS),
    nonNegative("Green coffee price"),
  ),
  roastProfiles: z.record(
    z.enum(ROAST_PROFILES),
    z.object({
      lossRate: rate("Loss rate"),
      cycleMinutes: positive("Batch cycle time"),
    }),
  ),
  roasterCapacityKg: positive("Roaster capacity"),
  grindMinutesPerKg: z.record(z.enum(GRINDS), nonNegative("Grinding time")),
  bagSizes: z.record(
    z.enum(BAG_SIZES),
    z.object({
      weightKg: positive("Bag weight"),
      packagingCostCad: nonNegative("Packaging cost"),
      packingMinutes: nonNegative("Packing time"),
    }),
  ),
  hourlyRatesCad: z.record(z.enum(STATIONS), nonNegative("Hourly rate")),
  overheadRate: rate("Overhead"),
  marginRate: rate("Margin"),
  exchangeRatesCad: z.record(
    z.enum(CURRENCIES).exclude(["CAD"]),
    positive("Exchange rate"),
  ),
  quoteValidityDays: z.coerce
    .number({ error: "Quote validity must be a number" })
    .int({ error: "Quote validity must be a whole number of days" })
    .min(1, { error: "Quote validity must be at least 1 day" })
    .max(365, { error: "Quote validity must be 365 days or less" }),
}) satisfies z.ZodType<PricingSettings>;

/**
 * Settings grouped as in the `/settings` page (`docs/design.md`, "Settings").
 * Each schema below validates only the fields of its category, so a
 * category form can be saved on its own; reused on the client for inline
 * validation and on the server by the `saveSettingsCategory` Server Action
 * (`lib/actions.ts`), which merges the validated data into the visitor's
 * current settings.
 */
export const SETTINGS_CATEGORIES = [
  "greenCoffee",
  "roasting",
  "packaging",
  "labor",
  "overheadMargin",
  "currencies",
  "quotes",
] as const;
export type SettingsCategory = (typeof SETTINGS_CATEGORIES)[number];

export const greenCoffeeCategorySchema = pricingSettingsSchema.pick({
  greenCoffeeUsdPerKg: true,
});

export const roastingCategorySchema = pricingSettingsSchema.pick({
  roastProfiles: true,
  roasterCapacityKg: true,
});

/** Bag weight is fixed by the bag size and excluded on purpose: not editable. */
export const packagingCategorySchema = z.object({
  bagSizes: z.record(
    z.enum(BAG_SIZES),
    z.object({
      packagingCostCad: nonNegative("Packaging cost"),
      packingMinutes: nonNegative("Packing time"),
    }),
  ),
});

export const laborCategorySchema = pricingSettingsSchema.pick({
  hourlyRatesCad: true,
  grindMinutesPerKg: true,
});

export const overheadMarginCategorySchema = pricingSettingsSchema.pick({
  overheadRate: true,
  marginRate: true,
});

export const currenciesCategorySchema = pricingSettingsSchema.pick({
  exchangeRatesCad: true,
});

export const quotesCategorySchema = pricingSettingsSchema.pick({
  quoteValidityDays: true,
});

export const configurationSchema = z.object({
  originId: z.enum(ORIGINS, { error: "Choose a coffee from the list" }),
  roast: z.enum(ROAST_PROFILES, {
    error: "Choose a roast profile from the list",
  }),
  grind: z.enum(GRINDS, { error: "Choose a grind from the list" }),
  bagSize: z.enum(BAG_SIZES, { error: "Choose a bag size from the list" }),
  quantity: z
    .number({ error: "Number of bags must be a number" })
    .int({ error: "Number of bags must be a whole number" })
    .min(1, { error: "Number of bags must be at least 1" })
    .max(MAX_QUANTITY, { error: "Number of bags must be 10,000 or less" }),
  currency: z.enum(CURRENCIES, { error: "Choose a currency from the list" }),
}) satisfies z.ZodType<Configuration>;
