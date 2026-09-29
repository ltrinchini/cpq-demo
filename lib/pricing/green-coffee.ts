import Decimal from "decimal.js";
import type { Configuration, PricingSettings } from "./types";

export interface GreenCoffee {
  roastedKg: Decimal;
  /** Green coffee needed before roast loss. */
  greenCoffeeKg: Decimal;
  /** The blend's origins, weighted average by their percentages. */
  usdPerKg: Decimal;
  /** Unrounded. */
  costCad: Decimal;
}

export function calculateGreenCoffee(
  settings: PricingSettings,
  configuration: Configuration,
): GreenCoffee {
  const { lossRate } = settings.roastProfiles[configuration.roast];

  const roastedKg = settings.bagSizes[configuration.bagSize].weightKg.times(
    configuration.quantity,
  );
  const greenCoffeeKg = roastedKg.dividedBy(lossRate.negated().plus(1));
  const usdPerKg = configuration.origins.reduce(
    (sum, origin) =>
      sum.plus(
        settings.greenCoffeeUsdPerKg[origin.originId].times(origin.percentage),
      ),
    new Decimal(0),
  );
  const costCad = greenCoffeeKg
    .times(usdPerKg)
    .times(settings.exchangeRatesCad.USD);

  return { roastedKg, greenCoffeeKg, usdPerKg, costCad };
}
