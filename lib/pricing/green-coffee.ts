import type Decimal from "decimal.js";
import type { Configuration, PricingSettings } from "./types";

export interface GreenCoffee {
  roastedKg: Decimal;
  /** Green coffee needed before roast loss. */
  greenCoffeeKg: Decimal;
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
  const costCad = greenCoffeeKg
    .times(settings.greenCoffeeUsdPerKg[configuration.originId])
    .times(settings.exchangeRatesCad.USD);

  return { roastedKg, greenCoffeeKg, costCad };
}
