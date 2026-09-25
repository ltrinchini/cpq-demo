import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { calculatePrice } from "./index";
import { referenceConfiguration, referenceSettings } from "./test-fixtures";
import { COST_LINES, CURRENCIES, type Currency } from "./types";

/** Compares to 10 decimals: non-terminating values are not exact. */
function expectDecimal(actual: Decimal, expected: string) {
  expect(actual.toDecimalPlaces(10).toString()).toBe(expected);
}

function priceReference(currency: Currency) {
  return calculatePrice(referenceSettings(), {
    ...referenceConfiguration(),
    currency,
  });
}

describe("calculatePrice", () => {
  it("reproduces the spec's reference example in CAD", () => {
    const result = priceReference("CAD");

    expect(result.currency).toBe("CAD");
    expectDecimal(result.unitPrice, "31.14");
    expectDecimal(result.total, "747.36");
    expectDecimal(result.pricePerKg, "31.14");
    expectDecimal(result.markup, "0.5384615385");
    expectDecimal(result.lines.greenCoffee, "326.4");
    expectDecimal(result.lines.packaging, "38.4");
    expectDecimal(result.lines.labor, "57.6");
    expectDecimal(result.lines.overhead, "63.36");
    expectDecimal(result.lines.margin, "261.6");
  });

  it("reproduces the spec's reference example in USD", () => {
    const result = priceReference("USD");

    expect(result.currency).toBe("USD");
    expectDecimal(result.unitPrice, "22.9");
    expectDecimal(result.total, "549.6");
    expectDecimal(result.pricePerKg, "22.9");
    expectDecimal(result.markup, "0.5384615385");
    expectDecimal(result.lines.greenCoffee, "240");
    expectDecimal(result.lines.packaging, "28.24");
    expectDecimal(result.lines.labor, "42.35");
    expectDecimal(result.lines.overhead, "46.59");
    // The exact margin, 192.33, absorbs the rounding difference.
    expectDecimal(result.lines.margin, "192.42");
  });

  it("returns the reference example's calculation details", () => {
    const { details } = priceReference("USD");

    expectDecimal(details.roastedKg, "24");
    expectDecimal(details.greenCoffeeKg, "28.5714285714");
    expectDecimal(details.batches, "2");

    expectDecimal(details.labor.roasting.minutes, "36");
    expectDecimal(details.labor.roasting.costCad, "19.2");
    expectDecimal(details.labor.grinding.minutes, "72");
    expectDecimal(details.labor.grinding.costCad, "31.2");
    expectDecimal(details.labor.packing.minutes, "18");
    expectDecimal(details.labor.packing.costCad, "7.2");

    expectDecimal(details.costsCad.greenCoffee, "326.4");
    expectDecimal(details.costsCad.packaging, "38.4");
    expectDecimal(details.costsCad.labor, "57.6");
    expectDecimal(details.costsCad.directCosts, "422.4");
    expectDecimal(details.costsCad.overhead, "63.36");
    expectDecimal(details.costsCad.totalCost, "485.76");
    expectDecimal(details.costsCad.sellingPrice, "747.3230769231");
  });

  it("returns the rates used for the configuration", () => {
    const { rates } = priceReference("USD").details;

    expectDecimal(rates.greenCoffeeUsdPerKg, "8.4");
    expectDecimal(rates.usdRate, "1.36");
    expectDecimal(rates.quoteCurrencyRate, "1.36");
    expectDecimal(rates.lossRate, "0.16");
    expectDecimal(rates.cycleMinutes, "18");
    expectDecimal(rates.roasterCapacityKg, "15");
    expectDecimal(rates.grindMinutesPerKg, "3");
    expectDecimal(rates.bagWeightKg, "1");
    expectDecimal(rates.packagingCostCad, "1.6");
    expectDecimal(rates.packingMinutes, "0.75");
    expectDecimal(rates.hourlyRatesCad.roasting, "32");
    expectDecimal(rates.hourlyRatesCad.grinding, "26");
    expectDecimal(rates.hourlyRatesCad.packing, "24");
    expectDecimal(rates.overheadRate, "0.15");
    expectDecimal(rates.marginRate, "0.35");
  });

  it("uses a quote currency rate of 1 in CAD", () => {
    expectDecimal(priceReference("CAD").details.rates.quoteCurrencyRate, "1");
  });

  it.each(CURRENCIES)("adds the lines up to the total in %s", (currency) => {
    const result = priceReference(currency);
    const sum = Decimal.sum(...COST_LINES.map((line) => result.lines[line]));

    expect(sum.equals(result.total)).toBe(true);
  });
});
