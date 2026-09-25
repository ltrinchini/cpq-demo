import Decimal from "decimal.js";

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
