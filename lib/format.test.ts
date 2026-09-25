import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatPercent,
  formatQuantity,
  fromPercentInput,
  normalizeDecimalInput,
  toPercentInput,
} from "./format";

describe("normalizeDecimalInput", () => {
  it.each([
    ["8.40", "8.40"],
    ["8,40", "8.40"],
    ["  8.40  ", "8.40"],
  ])("normalizes %j to %j", (raw, expected) => {
    expect(normalizeDecimalInput(raw)).toBe(expected);
  });
});

describe("toPercentInput / fromPercentInput", () => {
  it("round-trips a fraction through its percentage", () => {
    expect(toPercentInput("0.15")).toBe("15");
    expect(fromPercentInput("15")).toBe("0.15");
  });

  it("fromPercentInput accepts a comma", () => {
    expect(fromPercentInput("15,5")).toBe("0.155");
  });

  it("fromPercentInput passes non-numeric input through unchanged", () => {
    expect(fromPercentInput("abc")).toBe("abc");
  });
});

describe("formatPercent", () => {
  it("formats a fraction as a percentage", () => {
    expect(formatPercent("0.35")).toBe("35%");
    expect(formatPercent("0.5385")).toBe("53.9%");
  });
});

describe("formatCurrency", () => {
  it.each([
    ["CAD", "$1,234.56"],
    ["USD", "US$1,234.56"],
    ["EUR", "€1,234.56"],
    ["GBP", "£1,234.56"],
  ] as const)("formats an amount in %s", (currency, expected) => {
    expect(formatCurrency("1234.56", currency)).toBe(expected);
  });

  it("accepts a Decimal", () => {
    expect(formatCurrency(new Decimal("42"), "CAD")).toBe("$42.00");
  });
});

describe("formatQuantity", () => {
  it("formats an invariant unit", () => {
    expect(formatQuantity("11.9", "kg")).toBe("11.9 kg");
  });

  it("uses the plural form above one", () => {
    expect(formatQuantity(3, "batch", "batches")).toBe("3 batches");
    expect(formatQuantity(24, "bag", "bags")).toBe("24 bags");
  });

  it("uses the singular form for exactly one", () => {
    expect(formatQuantity(1, "bag", "bags")).toBe("1 bag");
  });
});
