import { describe, expect, it } from "vitest";
import {
  formatPercent,
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
