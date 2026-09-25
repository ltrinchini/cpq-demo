import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { calculateGreenCoffee } from "./green-coffee";
import { calculateLabor } from "./labor";
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
  const fullConfiguration = { ...referenceConfiguration(), ...configuration };

  return calculateLabor(
    settings,
    fullConfiguration,
    calculateGreenCoffee(settings, fullConfiguration),
  );
}

describe("calculateLabor", () => {
  it("reproduces the spec's reference example", () => {
    const result = calculate();

    expectDecimal(result.batches, "2");
    expectDecimal(result.stations.roasting.minutes, "36");
    expectDecimal(result.stations.roasting.costCad, "19.2");
    expectDecimal(result.stations.grinding.minutes, "72");
    expectDecimal(result.stations.grinding.costCad, "31.2");
    expectDecimal(result.stations.packing.minutes, "18");
    expectDecimal(result.stations.packing.costCad, "7.2");
    expectDecimal(result.costCad, "57.6");
  });

  describe("batches", () => {
    // 21 bags of 1 kg at a 0.16 loss rate need exactly 25 kg of green coffee.
    it("does not add a batch when the green coffee kg is a multiple of the capacity", () => {
      const settings = referenceSettings();
      settings.roasterCapacityKg = new Decimal("12.5");

      expectDecimal(calculate({ quantity: 21 }, settings).batches, "2");
    });

    it("adds a batch when the green coffee kg is just above a multiple", () => {
      const settings = referenceSettings();
      settings.roasterCapacityKg = new Decimal("12.5");

      // 22 bags need 26.19 kg.
      expectDecimal(calculate({ quantity: 22 }, settings).batches, "3");
    });

    it("counts a full batch for a single small bag", () => {
      const result = calculate({ bagSize: "250g", quantity: 1 });

      expectDecimal(result.batches, "1");
      expectDecimal(result.stations.roasting.minutes, "18");
      expectDecimal(result.stations.roasting.costCad, "9.6");
    });

    it("uses exactly one batch at full capacity", () => {
      const settings = referenceSettings();
      settings.roasterCapacityKg = new Decimal("25");

      expectDecimal(calculate({ quantity: 21 }, settings).batches, "1");
      expectDecimal(calculate({ quantity: 22 }, settings).batches, "2");
    });
  });

  it.each([
    ["light", "2", "32", "17.0666666667"],
    ["medium", "3", "54", "28.8"],
    ["dark", "3", "63", "33.6"],
  ] as const)(
    "applies the %s roast loss rate and cycle time",
    (roast, batches, minutes, costCad) => {
      const settings = referenceSettings();
      // Light needs 27.9 kg, under 2 × 14 kg; medium 28.6 kg, above it.
      settings.roasterCapacityKg = new Decimal("14");

      const result = calculate({ roast }, settings);

      expectDecimal(result.batches, batches);
      expectDecimal(result.stations.roasting.minutes, minutes);
      expectDecimal(result.stations.roasting.costCad, costCad);
    },
  );

  it.each([
    ["whole", "0", "0"],
    ["espresso", "72", "31.2"],
    ["filter", "48", "20.8"],
  ] as const)("applies the %s grinding time", (grind, minutes, costCad) => {
    const result = calculate({ grind });

    expectDecimal(result.stations.grinding.minutes, minutes);
    expectDecimal(result.stations.grinding.costCad, costCad);
  });

  it("does not grind whole beans", () => {
    expectDecimal(calculate({ grind: "whole" }).costCad, "26.4");
  });

  it.each([
    ["250g", "12", "4.8"],
    ["1kg", "18", "7.2"],
    ["5kg", "36", "14.4"],
  ] as const)("applies the %s packing time", (bagSize, minutes, costCad) => {
    const result = calculate({ bagSize });

    expectDecimal(result.stations.packing.minutes, minutes);
    expectDecimal(result.stations.packing.costCad, costCad);
  });

  it("uses each station's hourly rate", () => {
    const settings = referenceSettings();
    settings.hourlyRatesCad = {
      roasting: new Decimal("40"),
      grinding: new Decimal("30"),
      packing: new Decimal("20"),
    };

    const result = calculate({}, settings);

    expectDecimal(result.stations.roasting.costCad, "24");
    expectDecimal(result.stations.grinding.costCad, "36");
    expectDecimal(result.stations.packing.costCad, "6");
    expectDecimal(result.costCad, "66");
  });

  it("does not round the station costs", () => {
    const settings = referenceSettings();
    settings.hourlyRatesCad.packing = new Decimal("25");

    // 0.75 min × 25 CAD/h / 60 = 0.3125 CAD per bag.
    expectDecimal(
      calculate({ quantity: 1 }, settings).stations.packing.costCad,
      "0.3125",
    );
  });

  it("does not depend on the origin or quote currency", () => {
    expectDecimal(
      calculate({ originId: "kenya-nyeri", currency: "EUR" }).costCad,
      "57.6",
    );
  });
});
