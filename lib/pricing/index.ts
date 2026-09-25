import { calculateGreenCoffee } from "./green-coffee";
import { calculateLabor } from "./labor";
import { calculatePackaging } from "./packaging";
import { convertToQuoteCurrency } from "./quote-currency";
import { calculateSellingPrice } from "./selling-price";
import type { Configuration, PriceResult, PricingSettings } from "./types";

/** Complete, detailed price of a configuration. Assumes validated inputs. */
export function calculatePrice(
  settings: PricingSettings,
  configuration: Configuration,
): PriceResult {
  const profile = settings.roastProfiles[configuration.roast];
  const bag = settings.bagSizes[configuration.bagSize];

  const greenCoffee = calculateGreenCoffee(settings, configuration);
  const packaging = calculatePackaging(settings, configuration);
  const labor = calculateLabor(settings, configuration, greenCoffee);
  const selling = calculateSellingPrice(settings, {
    greenCoffee: greenCoffee.costCad,
    packaging,
    labor: labor.costCad,
  });

  const quote = convertToQuoteCurrency(
    settings,
    configuration.currency,
    configuration.quantity,
    greenCoffee.roastedKg,
    {
      greenCoffee: greenCoffee.costCad,
      packaging,
      labor: labor.costCad,
      overhead: selling.overhead,
      sellingPrice: selling.sellingPrice,
    },
  );

  return {
    currency: configuration.currency,
    unitPrice: quote.unitPrice,
    total: quote.total,
    pricePerKg: quote.pricePerKg,
    markup: selling.markup,
    lines: quote.lines,
    details: {
      roastedKg: greenCoffee.roastedKg,
      greenCoffeeKg: greenCoffee.greenCoffeeKg,
      batches: labor.batches,
      labor: labor.stations,
      costsCad: {
        greenCoffee: greenCoffee.costCad,
        packaging,
        labor: labor.costCad,
        directCosts: selling.directCosts,
        overhead: selling.overhead,
        totalCost: selling.totalCost,
        sellingPrice: selling.sellingPrice,
      },
      rates: {
        greenCoffeeUsdPerKg:
          settings.greenCoffeeUsdPerKg[configuration.originId],
        usdRate: settings.exchangeRatesCad.USD,
        quoteCurrencyRate: quote.rate,
        lossRate: profile.lossRate,
        cycleMinutes: profile.cycleMinutes,
        roasterCapacityKg: settings.roasterCapacityKg,
        grindMinutesPerKg: settings.grindMinutesPerKg[configuration.grind],
        bagWeightKg: bag.weightKg,
        packagingCostCad: bag.packagingCostCad,
        packingMinutes: bag.packingMinutes,
        hourlyRatesCad: settings.hourlyRatesCad,
        overheadRate: settings.overheadRate,
        marginRate: settings.marginRate,
      },
    },
  };
}
