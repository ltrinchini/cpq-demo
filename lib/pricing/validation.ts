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

const MAX_QUANTITY = 10_000;

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
}) satisfies z.ZodType<PricingSettings>;

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
