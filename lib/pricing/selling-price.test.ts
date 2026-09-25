import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { calculateSellingPrice, type DirectCosts } from "./selling-price";
import { referenceSettings } from "./test-fixtures";

/** Compares to 10 decimals: non-terminating values are not exact. */
function expectDecimal(actual: Decimal, expected: string) {
  expect(actual.toDecimalPlaces(10).toString()).toBe(expected);
}

/** Direct costs of the spec's reference example. */
function referenceDirectCosts(): DirectCosts {
  return {
    greenCoffee: new Decimal("326.4"),
    packaging: new Decimal("38.4"),
    labor: new Decimal("57.6"),
  };
}

describe("calculateSellingPrice", () => {
  it("reproduces the spec's reference example", () => {
    const result = calculateSellingPrice(
      referenceSettings(),
      referenceDirectCosts(),
    );

    expectDecimal(result.directCosts, "422.4");
    expectDecimal(result.overhead, "63.36");
    expectDecimal(result.totalCost, "485.76");
    expectDecimal(result.sellingPrice, "747.3230769231");
    expectDecimal(result.markup, "0.5384615385");
  });

  it("adds up the three direct costs", () => {
    const result = calculateSellingPrice(referenceSettings(), {
      greenCoffee: new Decimal("100"),
      packaging: new Decimal("20"),
      labor: new Decimal("30"),
    });

    expectDecimal(result.directCosts, "150");
  });

  it("uses the overhead rate from the settings", () => {
    const settings = referenceSettings();
    settings.overheadRate = new Decimal("0.2");

    const result = calculateSellingPrice(settings, referenceDirectCosts());

    expectDecimal(result.overhead, "84.48");
    expectDecimal(result.totalCost, "506.88");
  });

  it("adds no overhead when the rate is 0", () => {
    const settings = referenceSettings();
    settings.overheadRate = new Decimal("0");

    const result = calculateSellingPrice(settings, referenceDirectCosts());

    expectDecimal(result.overhead, "0");
    expectDecimal(result.totalCost, "422.4");
  });

  it("takes the margin on the selling price, not on the cost", () => {
    const settings = referenceSettings();
    settings.marginRate = new Decimal("0.5");

    const result = calculateSellingPrice(settings, referenceDirectCosts());

    // A 50% margin doubles the cost: a 50% markup would give 728.64.
    expectDecimal(result.sellingPrice, "971.52");
    expectDecimal(result.markup, "1");
  });

  it("sells at cost when the margin is 0", () => {
    const settings = referenceSettings();
    settings.marginRate = new Decimal("0");

    const result = calculateSellingPrice(settings, referenceDirectCosts());

    expectDecimal(result.sellingPrice, "485.76");
    expectDecimal(result.markup, "0");
  });

  it("handles a margin close to 100%", () => {
    const settings = referenceSettings();
    settings.marginRate = new Decimal("0.99");

    const result = calculateSellingPrice(settings, referenceDirectCosts());

    expectDecimal(result.sellingPrice, "48576");
    expectDecimal(result.markup, "99");
  });

  it("does not round the costs", () => {
    const settings = referenceSettings();
    settings.overheadRate = new Decimal("0.125");

    const result = calculateSellingPrice(settings, {
      greenCoffee: new Decimal("0.01"),
      packaging: new Decimal("0"),
      labor: new Decimal("0"),
    });

    expectDecimal(result.overhead, "0.00125");
    expectDecimal(result.totalCost, "0.01125");
  });

  it("costs nothing when every direct cost is 0", () => {
    const zero = new Decimal("0");

    const result = calculateSellingPrice(referenceSettings(), {
      greenCoffee: zero,
      packaging: zero,
      labor: zero,
    });

    expectDecimal(result.sellingPrice, "0");
    expectDecimal(result.markup, "0.5384615385");
  });
});
