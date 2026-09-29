"use server";

import { z } from "zod";
import {
  createQuote,
  deleteQuote as deleteQuoteRow,
  getSettings,
  resetSettings,
  updateSettings,
} from "@/lib/db/queries";
import type { BagSize, PricingSettings } from "@/lib/pricing/types";
import {
  configurationSchema,
  currenciesCategorySchema,
  greenCoffeeCategorySchema,
  laborCategorySchema,
  overheadMarginCategorySchema,
  packagingCategorySchema,
  quotesCategorySchema,
  roastingCategorySchema,
  SETTINGS_CATEGORIES,
  type SettingsCategory,
} from "@/lib/pricing/validation";
import { readVisitorId } from "@/lib/visitor";
import { fieldErrorsFromZodError as fieldErrors } from "@/lib/zod-errors";

export type SaveSettingsCategoryResult =
  { success: true } | { success: false; fieldErrors: Record<string, string> };

/**
 * Validates and saves one category of the visitor's pricing settings
 * (`docs/design.md`, "Settings"). Prices are always recalculated from
 * settings on the server, so this is the only way a visitor's settings
 * change. Every other field of `PricingSettings` is left untouched.
 */
export async function saveSettingsCategory(
  category: SettingsCategory,
  data: unknown,
): Promise<SaveSettingsCategoryResult> {
  if (!SETTINGS_CATEGORIES.includes(category)) {
    return { success: false, fieldErrors: { root: "Unknown category." } };
  }

  const visitorId = await readVisitorId();
  if (!visitorId) {
    return {
      success: false,
      fieldErrors: {
        root: "Your sandbox could not be identified. Reload the page and try again.",
      },
    };
  }

  const current = await getSettings(visitorId);
  let merged: PricingSettings;

  switch (category) {
    case "greenCoffee": {
      const parsed = greenCoffeeCategorySchema.safeParse(data);
      if (!parsed.success) {
        return { success: false, fieldErrors: fieldErrors(parsed.error) };
      }
      merged = { ...current, ...parsed.data };
      break;
    }
    case "roasting": {
      const parsed = roastingCategorySchema.safeParse(data);
      if (!parsed.success) {
        return { success: false, fieldErrors: fieldErrors(parsed.error) };
      }
      merged = { ...current, ...parsed.data };
      break;
    }
    case "packaging": {
      const parsed = packagingCategorySchema.safeParse(data);
      if (!parsed.success) {
        return { success: false, fieldErrors: fieldErrors(parsed.error) };
      }
      const bagSizes = { ...current.bagSizes };
      for (const size of Object.keys(parsed.data.bagSizes) as BagSize[]) {
        bagSizes[size] = { ...bagSizes[size], ...parsed.data.bagSizes[size] };
      }
      merged = { ...current, bagSizes };
      break;
    }
    case "labor": {
      const parsed = laborCategorySchema.safeParse(data);
      if (!parsed.success) {
        return { success: false, fieldErrors: fieldErrors(parsed.error) };
      }
      merged = { ...current, ...parsed.data };
      break;
    }
    case "overheadMargin": {
      const parsed = overheadMarginCategorySchema.safeParse(data);
      if (!parsed.success) {
        return { success: false, fieldErrors: fieldErrors(parsed.error) };
      }
      merged = { ...current, ...parsed.data };
      break;
    }
    case "currencies": {
      const parsed = currenciesCategorySchema.safeParse(data);
      if (!parsed.success) {
        return { success: false, fieldErrors: fieldErrors(parsed.error) };
      }
      merged = { ...current, ...parsed.data };
      break;
    }
    case "quotes": {
      const parsed = quotesCategorySchema.safeParse(data);
      if (!parsed.success) {
        return { success: false, fieldErrors: fieldErrors(parsed.error) };
      }
      merged = { ...current, ...parsed.data };
      break;
    }
  }

  await updateSettings(visitorId, merged);
  return { success: true };
}

export type ResetDemoDataResult =
  { success: true } | { success: false; error: string };

/**
 * Restores every pricing setting to its demo default (`docs/design.md`,
 * "Settings"). Never touches quotes: a quote is frozen at save time, so a
 * reset leaves every saved quote exactly as it was.
 */
export async function resetDemoData(): Promise<ResetDemoDataResult> {
  const visitorId = await readVisitorId();
  if (!visitorId) {
    return {
      success: false,
      error:
        "Your sandbox could not be identified. Reload the page and try again.",
    };
  }

  await resetSettings(visitorId);
  return { success: true };
}

const saveQuoteInputSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, { error: "Customer name is required" })
    .max(200, { error: "Customer name must be 200 characters or less" }),
  notes: z
    .string()
    .trim()
    .max(2000, { error: "Notes must be 2,000 characters or less" })
    .optional(),
  configuration: configurationSchema,
});

export type SaveQuoteResult =
  | { success: true; number: string }
  | { success: false; fieldErrors: Record<string, string> };

/**
 * Saves the visitor's current configuration as a frozen quote
 * (`docs/design.md`, "Save dialog"). The price is always recalculated on
 * the server from the settings stored in the database, never trusted from
 * the browser.
 */
export async function saveQuote(data: unknown): Promise<SaveQuoteResult> {
  const parsed = saveQuoteInputSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, fieldErrors: fieldErrors(parsed.error) };
  }

  const visitorId = await readVisitorId();
  if (!visitorId) {
    return {
      success: false,
      fieldErrors: {
        root: "Your sandbox could not be identified. Reload the page and try again.",
      },
    };
  }

  const { customerName, notes, configuration } = parsed.data;
  const saved = await createQuote(visitorId, {
    customerName,
    notes: notes || null,
    configuration,
  });
  return { success: true, number: saved.number };
}

export type DeleteQuoteResult =
  { success: true } | { success: false; error: string };

/**
 * Deletes one of the visitor's quotes by number (`docs/design.md`,
 * "Quotes"). Always scoped to the visitor's own data.
 */
export async function deleteQuote(number: string): Promise<DeleteQuoteResult> {
  const visitorId = await readVisitorId();
  if (!visitorId) {
    return {
      success: false,
      error:
        "Your sandbox could not be identified. Reload the page and try again.",
    };
  }

  await deleteQuoteRow(visitorId, number);
  return { success: true };
}
