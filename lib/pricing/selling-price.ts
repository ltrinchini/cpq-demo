import Decimal from "decimal.js";
import type { PricingSettings } from "./types";

/** Direct costs in CAD, unrounded. */
export interface DirectCosts {
  greenCoffee: Decimal;
  packaging: Decimal;
  labor: Decimal;
}

/** Unrounded, in CAD except the markup. */
export interface SellingPrice {
  directCosts: Decimal;
  overhead: Decimal;
  totalCost: Decimal;
  /** Total cost with the margin taken on the selling price. */
  sellingPrice: Decimal;
  /** Markup on cost equivalent to the margin, as a fraction. */
  markup: Decimal;
}

export function calculateSellingPrice(
  settings: PricingSettings,
  { greenCoffee, packaging, labor }: DirectCosts,
): SellingPrice {
  const directCosts = Decimal.sum(greenCoffee, packaging, labor);
  const overhead = directCosts.times(settings.overheadRate);
  const totalCost = directCosts.plus(overhead);

  const costShare = settings.marginRate.negated().plus(1);
  const sellingPrice = totalCost.dividedBy(costShare);
  const markup = settings.marginRate.dividedBy(costShare);

  return { directCosts, overhead, totalCost, sellingPrice, markup };
}
