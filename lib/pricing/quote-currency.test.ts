import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { convertToQuoteCurrency, type CostsCad } from "./quote-currency";
import { referenceSettings } from "./test-fixtures";
import { COST_LINES, CURRENCIES, type Currency } from "./types";

/** Compares to 10 decimals: non-terminating values are not exact. */
function expectDecimal(actual: Decimal, expected: string) {
  expect(actual.toDecimalPlaces(10).toString()).toBe(expected);
}

/** Unrounded CAD costs of the spec's reference example. */
function referenceCostsCad(): CostsCad {
  return {
    greenCoffee: new Decimal("326.4"),
    packaging: new Decimal("38.4"),
    labor: new Decimal("57.6"),
    overhead: new Decimal("63.36"),
    sellingPrice: new Decimal("485.76").dividedBy("0.65"),
  };
}

/** The reference example: 24 bags of 1 kg. */
function convertReference(currency: Currency, settings = referenceSettings()) {
  return convertToQuoteCurrency(
    settings,
    currency,
    24,
    new Decimal("24"),
    referenceCostsCad(),
  );
}

function zeroCostsCad(sellingPrice: string): CostsCad {
  const zero = new Decimal("0");

  return {
    greenCoffee: zero,
    packaging: zero,
    labor: zero,
    overhead: zero,
    sellingPrice: new Decimal(sellingPrice),
  };
}

describe("convertToQuoteCurrency", () => {
  it("reproduces the spec's reference example in CAD", () => {
    const result = convertReference("CAD");

    expectDecimal(result.rate, "1");
    expectDecimal(result.unitPrice, "31.14");
    expectDecimal(result.total, "747.36");
    expectDecimal(result.pricePerKg, "31.14");
    expectDecimal(result.lines.greenCoffee, "326.4");
    expectDecimal(result.lines.packaging, "38.4");
    expectDecimal(result.lines.labor, "57.6");
    expectDecimal(result.lines.overhead, "63.36");
    expectDecimal(result.lines.margin, "261.6");
  });

  it("reproduces the spec's reference example in USD", () => {
    const result = convertReference("USD");

    expectDecimal(result.rate, "1.36");
    expectDecimal(result.unitPrice, "22.9");
    expectDecimal(result.total, "549.6");
    expectDecimal(result.pricePerKg, "22.9");
    expectDecimal(result.lines.greenCoffee, "240");
    expectDecimal(result.lines.packaging, "28.24");
    expectDecimal(result.lines.labor, "42.35");
    expectDecimal(result.lines.overhead, "46.59");
    // The exact margin, 192.33, absorbs the rounding difference.
    expectDecimal(result.lines.margin, "192.42");
  });

  it("converts to EUR", () => {
    const result = convertReference("EUR");

    expectDecimal(result.rate, "1.5");
    expectDecimal(result.unitPrice, "20.76");
    expectDecimal(result.total, "498.24");
    expectDecimal(result.lines.greenCoffee, "217.6");
    expectDecimal(result.lines.packaging, "25.6");
    expectDecimal(result.lines.labor, "38.4");
    expectDecimal(result.lines.overhead, "42.24");
    expectDecimal(result.lines.margin, "174.4");
  });

  it("converts to GBP", () => {
    const result = convertReference("GBP");

    expectDecimal(result.rate, "1.72");
    expectDecimal(result.unitPrice, "18.1");
    expectDecimal(result.total, "434.4");
    expectDecimal(result.lines.greenCoffee, "189.77");
    expectDecimal(result.lines.packaging, "22.33");
    expectDecimal(result.lines.labor, "33.49");
    expectDecimal(result.lines.overhead, "36.84");
    expectDecimal(result.lines.margin, "151.97");
  });

  it.each(CURRENCIES)(
    "adds the lines up exactly to the total in %s",
    (currency) => {
      const result = convertReference(currency);

      const sum = Decimal.sum(...COST_LINES.map((line) => result.lines[line]));
      expect(sum.equals(result.total)).toBe(true);
    },
  );

  it("uses the exchange rate from the settings", () => {
    const settings = referenceSettings();
    settings.exchangeRatesCad.USD = new Decimal("2");

    const result = convertReference("USD", settings);

    expectDecimal(result.unitPrice, "15.57");
    expectDecimal(result.lines.greenCoffee, "163.2");
  });

  describe("rounding", () => {
    it("rounds a unit price on x.xx5 half up", () => {
      const result = convertToQuoteCurrency(
        referenceSettings(),
        "CAD",
        2,
        new Decimal("2"),
        zeroCostsCad("10.05"),
      );

      // Banker's rounding would give 5.02.
      expectDecimal(result.unitPrice, "5.03");
      expectDecimal(result.total, "10.06");
    });

    it("rounds a converted unit price on x.xx5 half up", () => {
      const settings = referenceSettings();
      settings.exchangeRatesCad.EUR = new Decimal("2");

      const result = convertToQuoteCurrency(
        settings,
        "EUR",
        2,
        new Decimal("2"),
        zeroCostsCad("20.1"),
      );

      expectDecimal(result.unitPrice, "5.03");
    });

    it("rounds a line on x.xx5 half up", () => {
      const result = convertToQuoteCurrency(
        referenceSettings(),
        "CAD",
        1,
        new Decimal("1"),
        { ...zeroCostsCad("1"), packaging: new Decimal("0.125") },
      );

      expectDecimal(result.lines.packaging, "0.13");
      expectDecimal(result.lines.margin, "0.87");
    });

    it("rounds the unit price, not the total", () => {
      const result = convertToQuoteCurrency(
        referenceSettings(),
        "CAD",
        3,
        new Decimal("3"),
        zeroCostsCad("10"),
      );

      expectDecimal(result.unitPrice, "3.33");
      expectDecimal(result.total, "9.99");
    });

    it("does not round the price per kg", () => {
      const result = convertToQuoteCurrency(
        referenceSettings(),
        "CAD",
        3,
        new Decimal("15"),
        zeroCostsCad("10"),
      );

      expectDecimal(result.pricePerKg, "0.666");
    });

    it("lets the margin line go below zero to absorb the rounding", () => {
      // With no margin, two lines rounded up exceed the total.
      const result = convertToQuoteCurrency(
        referenceSettings(),
        "CAD",
        1,
        new Decimal("1"),
        {
          ...zeroCostsCad("0.01"),
          greenCoffee: new Decimal("0.005"),
          packaging: new Decimal("0.005"),
        },
      );

      expectDecimal(result.total, "0.01");
      expectDecimal(result.lines.greenCoffee, "0.01");
      expectDecimal(result.lines.packaging, "0.01");
      expectDecimal(result.lines.margin, "-0.01");
    });
  });
});
