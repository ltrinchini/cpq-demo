import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { breakdownWidths } from "./breakdown";
import { calculatePrice } from "./pricing/index";
import { COST_LINES } from "./pricing/types";
import {
  referenceConfiguration,
  referenceSettings,
} from "./pricing/test-fixtures";

describe("breakdownWidths", () => {
  it("sums to 100 for a real price breakdown", () => {
    const { lines, total } = calculatePrice(
      referenceSettings(),
      referenceConfiguration(),
    );

    const widths = breakdownWidths(lines, total);

    const sum = COST_LINES.reduce(
      (acc, line) => acc.plus(widths[line]),
      new Decimal(0),
    );
    expect(sum.toDecimalPlaces(6).toNumber()).toBe(100);
  });

  it("is zero for every line when the total is zero", () => {
    const zero = new Decimal(0);
    const lines = Object.fromEntries(COST_LINES.map((line) => [line, zero]));

    const widths = breakdownWidths(
      lines as Record<(typeof COST_LINES)[number], Decimal>,
      zero,
    );

    for (const line of COST_LINES) {
      expect(widths[line].toNumber()).toBe(0);
    }
  });
});
