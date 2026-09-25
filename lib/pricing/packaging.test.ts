import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { calculatePackaging } from "./packaging";
import { referenceConfiguration, referenceSettings } from "./test-fixtures";
import type { Configuration } from "./types";

function calculate(
  configuration: Partial<Configuration> = {},
  settings = referenceSettings(),
) {
  return calculatePackaging(settings, {
    ...referenceConfiguration(),
    ...configuration,
  }).toString();
}

describe("calculatePackaging", () => {
  it("reproduces the spec's reference example", () => {
    expect(calculate()).toBe("38.4");
  });

  it.each([
    ["250g", "20.4"],
    ["1kg", "38.4"],
    ["5kg", "84"],
  ] as const)("uses the %s bag cost", (bagSize, costCad) => {
    expect(calculate({ bagSize })).toBe(costCad);
  });

  it.each([
    [1, "1.6"],
    [7, "11.2"],
    [1000, "1600"],
  ])("multiplies the bag cost by %i bags", (quantity, costCad) => {
    expect(calculate({ quantity })).toBe(costCad);
  });

  it("uses the bag cost from the settings", () => {
    const settings = referenceSettings();
    settings.bagSizes["1kg"].packagingCostCad = new Decimal("2.15");

    expect(calculate({}, settings)).toBe("51.6");
  });

  it("does not round the cost", () => {
    const settings = referenceSettings();
    settings.bagSizes["1kg"].packagingCostCad = new Decimal("0.3333");

    expect(calculate({ quantity: 3 }, settings)).toBe("0.9999");
  });

  it("does not depend on the roast, grind, origin or quote currency", () => {
    expect(
      calculate({
        roast: "dark",
        grind: "whole",
        originId: "kenya-nyeri",
        currency: "GBP",
      }),
    ).toBe("38.4");
  });

  it("costs nothing when the bag cost is 0", () => {
    const settings = referenceSettings();
    settings.bagSizes["1kg"].packagingCostCad = new Decimal("0");

    expect(calculate({}, settings)).toBe("0");
  });
});
