import {
  formatCurrency,
  formatPercent,
  formatQuantity,
  formatRate,
} from "@/lib/format";
import { STATIONS } from "@/lib/pricing/types";
import type { CostLine, PriceResult, Station } from "@/lib/pricing/types";

/**
 * The formula behind each cost line, for "Show calculation details"
 * (`docs/design.md`, "Configurator (mobile)"). Display only: every value
 * comes straight from `PriceResult`, nothing is recomputed.
 */
export function calculationFormulas(
  price: PriceResult,
): Record<CostLine, string> {
  const { currency, markup, details } = price;
  const { rates, costsCad } = details;

  // The quote currency conversion (`÷ rate`) only shows up for the visitor
  // when the quote isn't in CAD; the base calculation is otherwise identical.
  const suffix =
    currency === "CAD" ? "" : ` ÷ ${formatRate(rates.quoteCurrencyRate)}`;
  const quantity = details.roastedKg.dividedBy(rates.bagWeightKg);

  const stationTerm = (station: Station) =>
    `${formatQuantity(details.labor[station].minutes, "min")} × ${formatCurrency(rates.hourlyRatesCad[station], "CAD")}/h`;

  return {
    greenCoffee: `${formatQuantity(details.greenCoffeeKg, "kg green")} × ${formatCurrency(rates.greenCoffeeUsdPerKg, "USD")} × ${formatRate(rates.usdRate)}${suffix}`,
    packaging: `${formatQuantity(quantity, "bag", "bags")} × ${formatCurrency(rates.packagingCostCad, "CAD")}${suffix}`,
    labor: `${STATIONS.map(stationTerm).join(" + ")}${suffix}`,
    overhead: `${formatCurrency(costsCad.directCosts, "CAD")} × ${formatPercent(rates.overheadRate)}${suffix}`,
    margin: `${formatCurrency(costsCad.totalCost, "CAD")} × ${formatPercent(markup)} markup${suffix}`,
  };
}
