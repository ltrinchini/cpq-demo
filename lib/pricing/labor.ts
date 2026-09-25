import Decimal from "decimal.js";
import type { GreenCoffee } from "./green-coffee";
import type { Configuration, PricingSettings, Station } from "./types";

const MINUTES_PER_HOUR = 60;

export interface Labor {
  /** Roaster batches, rounded up: a partial batch is a full cycle. */
  batches: Decimal;
  /** Unrounded. */
  stations: Record<Station, { minutes: Decimal; costCad: Decimal }>;
  /** Sum of the stations, unrounded. */
  costCad: Decimal;
}

export function calculateLabor(
  settings: PricingSettings,
  configuration: Configuration,
  { roastedKg, greenCoffeeKg }: GreenCoffee,
): Labor {
  const batches = greenCoffeeKg.dividedBy(settings.roasterCapacityKg).ceil();

  const cost = (station: Station, minutes: Decimal) => ({
    minutes,
    costCad: minutes
      .times(settings.hourlyRatesCad[station])
      .dividedBy(MINUTES_PER_HOUR),
  });

  const stations = {
    roasting: cost(
      "roasting",
      batches.times(settings.roastProfiles[configuration.roast].cycleMinutes),
    ),
    grinding: cost(
      "grinding",
      roastedKg.times(settings.grindMinutesPerKg[configuration.grind]),
    ),
    packing: cost(
      "packing",
      settings.bagSizes[configuration.bagSize].packingMinutes.times(
        configuration.quantity,
      ),
    ),
  };

  const costCad = Decimal.sum(
    stations.roasting.costCad,
    stations.grinding.costCad,
    stations.packing.costCad,
  );

  return { batches, stations, costCad };
}
