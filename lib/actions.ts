"use server";

import { getSettings, updateSettings } from "@/lib/db/queries";
import type { BagSize, PricingSettings } from "@/lib/pricing/types";
import {
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
