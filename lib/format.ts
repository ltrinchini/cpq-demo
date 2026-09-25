import Decimal from "decimal.js";
import type { Currency } from "@/lib/pricing/types";

/**
 * Normalizes a numeric field's raw input before validation: a comma is a
 * decimal separator here, not a thousands separator (`docs/design.md`,
 * "Input").
 */
export function normalizeDecimalInput(raw: string): string {
  return raw.trim().replace(",", ".");
}

/** A fraction (`0.15`) as the percentage a field shows (`"15"`). */
export function toPercentInput(fraction: string): string {
  return new Decimal(fraction).times(100).toString();
}

/**
 * The percentage a field holds (`"15"`, comma allowed) back to the
 * fraction the pricing schemas expect (`"0.15"`). Passes non-numeric input
 * through unchanged, so the schema reports its own "must be a number"
 * message instead of this helper throwing.
 */
export function fromPercentInput(raw: string): string {
  const normalized = normalizeDecimalInput(raw);
  try {
    return new Decimal(normalized).dividedBy(100).toString();
  } catch {
    return normalized;
  }
}

/** A fraction (`0.35`) formatted as a percentage for display (`"35%"`). */
export function formatPercent(fraction: Decimal | string): string {
  return new Intl.NumberFormat("en-CA", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(new Decimal(fraction).toNumber());
}

/** An amount in the given currency, formatted for display (`"US$1,234.56"`). */
export function formatCurrency(
  amount: Decimal | string | number,
  currency: Currency,
): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(new Decimal(amount).toNumber());
}

/**
 * A quantity with its unit, for display (`"11.9 kg"`, `"3 batches"`,
 * `"1 bag"`). `plural` defaults to `singular` for units that don't inflect
 * (`"kg"`).
 */
export function formatQuantity(
  value: Decimal | string | number,
  singular: string,
  plural: string = singular,
): string {
  const amount = new Decimal(value);
  const number = new Intl.NumberFormat("en-CA", {
    maximumFractionDigits: 2,
  }).format(amount.toNumber());
  const unit = amount.equals(1) ? singular : plural;
  return `${number} ${unit}`;
}
