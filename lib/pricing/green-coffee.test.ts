import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { calculateGreenCoffee } from "./green-coffee";
import { referenceConfiguration, referenceSettings } from "./test-fixtures";
import type { Configuration } from "./types";

/** Compares to 10 decimals: non-terminating values are not exact. */
function expectDecimal(actual: Decimal, expected: string) {
  expect(actual.toDecimalPlaces(10).toString()).toBe(expected);
}

function calculate(
  configuration: Partial<Configuration> = {},
  settings = referenceSettings(),
) {
  return calculateGreenCoffee(settings, {
    ...referenceConfiguration(),
    ...configuration,
  });
}

describe("calculateGreenCoffee", () => {
  it("reproduces the spec's reference example", () => {
    const result = calculate();

    expectDecimal(result.roastedKg, "24");
    expectDecimal(result.greenCoffeeKg, "28.5714285714");
    expectDecimal(result.costCad, "326.4");
  });

  it("does not round the green coffee kg", () => {
    expect(calculate().greenCoffeeKg.decimalPlaces()).toBeGreaterThan(10);
  });

  it.each([
    ["light", "27.9069767442", "318.8093023256"],
    ["medium", "28.5714285714", "326.4"],
    ["dark", "29.6296296296", "338.4888888889"],
  ] as const)(
    "applies the %s roast loss rate",
    (roast, greenCoffeeKg, costCad) => {
      const result = calculate({ roast });

      expectDecimal(result.greenCoffeeKg, greenCoffeeKg);
      expectDecimal(result.costCad, costCad);
    },
  );

  it.each([
    ["250g", "6", "7.1428571429", "81.6"],
    ["1kg", "24", "28.5714285714", "326.4"],
    ["5kg", "120", "142.8571428571", "1632"],
  ] as const)(
    "uses the %s bag weight",
    (bagSize, roastedKg, greenCoffeeKg, costCad) => {
      const result = calculate({ bagSize });

      expectDecimal(result.roastedKg, roastedKg);
      expectDecimal(result.greenCoffeeKg, greenCoffeeKg);
      expectDecimal(result.costCad, costCad);
    },
  );

  it("uses the price of the chosen origin", () => {
    expectDecimal(
      calculate({
        origins: [{ originId: "kenya-nyeri", percentage: 1 }],
      }).costCad,
      "373.0285714286",
    );
  });

  it("weights the price by each origin's percentage, in a blend", () => {
    const result = calculate({
      origins: [
        { originId: "ethiopia-yirgacheffe", percentage: 0.6 },
        { originId: "kenya-nyeri", percentage: 0.4 },
      ],
    });

    // 0.6 × 8.40 + 0.4 × 9.60 = 8.88 USD/kg.
    expectDecimal(result.usdPerKg, "8.88");
    expectDecimal(result.costCad, "345.0514285714");
  });

  it("supports a 3-origin blend", () => {
    const result = calculate({
      origins: [
        { originId: "ethiopia-yirgacheffe", percentage: 0.5 },
        { originId: "colombia-huila", percentage: 0.3 },
        { originId: "kenya-nyeri", percentage: 0.2 },
      ],
    });

    // 0.5 × 8.40 + 0.3 × 7.20 + 0.2 × 9.60 = 8.28 USD/kg.
    expectDecimal(result.usdPerKg, "8.28");
  });

  it("converts the USD price with the USD exchange rate", () => {
    const settings = referenceSettings();
    settings.exchangeRatesCad.USD = new Decimal("1.50");

    expectDecimal(calculate({}, settings).costCad, "360");
  });

  it("does not depend on the quote currency", () => {
    expectDecimal(calculate({ currency: "EUR" }).costCad, "326.4");
  });

  it("buys exactly the roasted kg when the loss rate is 0", () => {
    const settings = referenceSettings();
    settings.roastProfiles.medium.lossRate = new Decimal("0");

    const result = calculate({}, settings);

    expectDecimal(result.greenCoffeeKg, "24");
    expectDecimal(result.costCad, "274.176");
  });

  it("costs nothing when the green coffee price is 0", () => {
    const settings = referenceSettings();
    settings.greenCoffeeUsdPerKg["ethiopia-yirgacheffe"] = new Decimal("0");

    expectDecimal(calculate({}, settings).costCad, "0");
  });
});
