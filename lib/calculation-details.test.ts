import { describe, expect, it } from "vitest";
import { calculationFormulas } from "./calculation-details";
import { calculatePrice } from "./pricing/index";
import {
  referenceConfiguration,
  referenceSettings,
} from "./pricing/test-fixtures";

describe("calculationFormulas", () => {
  it("builds the formula for each line, in CAD", () => {
    const price = calculatePrice(referenceSettings(), referenceConfiguration());

    expect(calculationFormulas(price)).toEqual({
      greenCoffee: "28.57 kg green × US$8.40 × 1.36",
      packaging: "24 bags × $1.60",
      labor: "36 min × $32.00/h + 72 min × $26.00/h + 18 min × $24.00/h",
      overhead: "$422.40 × 15%",
      margin: "$485.76 × 53.8% markup",
    });
  });

  it("appends the quote currency conversion when it isn't CAD", () => {
    const price = calculatePrice(referenceSettings(), {
      ...referenceConfiguration(),
      currency: "USD",
    });

    const formulas = calculationFormulas(price);

    expect(formulas.greenCoffee).toBe("28.57 kg green × US$8.40 × 1.36 ÷ 1.36");
    expect(formulas.packaging).toBe("24 bags × $1.60 ÷ 1.36");
    expect(formulas.margin).toBe("$485.76 × 53.8% markup ÷ 1.36");
  });
});
