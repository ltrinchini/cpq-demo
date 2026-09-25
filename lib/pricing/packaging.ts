import type Decimal from "decimal.js";
import type { Configuration, PricingSettings } from "./types";

/** Packaging cost in CAD, unrounded. */
export function calculatePackaging(
  settings: PricingSettings,
  configuration: Configuration,
): Decimal {
  return settings.bagSizes[configuration.bagSize].packagingCostCad.times(
    configuration.quantity,
  );
}
