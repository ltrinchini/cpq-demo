import Decimal from "decimal.js";
import type { CostLine, Currency, PricingSettings } from "./types";

const DECIMAL_PLACES = 2;

/** Unrounded costs in CAD. */
export interface CostsCad extends Record<Exclude<CostLine, "margin">, Decimal> {
  sellingPrice: Decimal;
}

/** Amounts in the quote currency. */
export interface QuoteAmounts {
  /** CAD per 1 unit of the quote currency (1 for CAD). */
  rate: Decimal;
  /** Rounded. */
  unitPrice: Decimal;
  total: Decimal;
  /** Unrounded: rounded only for display. */
  pricePerKg: Decimal;
  /** Rounded, except the margin, which absorbs the rounding difference. */
  lines: Record<CostLine, Decimal>;
}

function round(amount: Decimal): Decimal {
  return amount.toDecimalPlaces(DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

export function exchangeRate(
  settings: PricingSettings,
  currency: Currency,
): Decimal {
  return currency === "CAD"
    ? new Decimal(1)
    : settings.exchangeRatesCad[currency];
}

export function convertToQuoteCurrency(
  settings: PricingSettings,
  currency: Currency,
  quantity: number,
  roastedKg: Decimal,
  costsCad: CostsCad,
): QuoteAmounts {
  const rate = exchangeRate(settings, currency);

  // A single division keeps the exact value as precise as possible.
  const unitPrice = round(
    costsCad.sellingPrice.dividedBy(rate.times(quantity)),
  );
  const total = unitPrice.times(quantity);
  const pricePerKg = total.dividedBy(roastedKg);

  const line = (cad: Decimal) => round(cad.dividedBy(rate));
  const greenCoffee = line(costsCad.greenCoffee);
  const packaging = line(costsCad.packaging);
  const labor = line(costsCad.labor);
  const overhead = line(costsCad.overhead);
  const margin = total.minus(
    Decimal.sum(greenCoffee, packaging, labor, overhead),
  );

  return {
    rate,
    unitPrice,
    total,
    pricePerKg,
    lines: { greenCoffee, packaging, labor, overhead, margin },
  };
}
