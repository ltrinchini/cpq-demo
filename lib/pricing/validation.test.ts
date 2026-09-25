import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  configurationSchema,
  currenciesCategorySchema,
  greenCoffeeCategorySchema,
  laborCategorySchema,
  overheadMarginCategorySchema,
  packagingCategorySchema,
  pricingSettingsSchema,
  quotesCategorySchema,
  roastingCategorySchema,
  SETTINGS_CATEGORIES,
} from "./validation";

// Reference settings from the spec, as they arrive from a form or the database.
function validSettings() {
  return {
    greenCoffeeUsdPerKg: {
      "ethiopia-yirgacheffe": "8.40",
      "colombia-huila": "7.20",
      "brazil-cerrado": "5.60",
      "guatemala-antigua": "7.80",
      "kenya-nyeri": "9.60",
    },
    roastProfiles: {
      light: { lossRate: "0.14", cycleMinutes: "16" },
      medium: { lossRate: "0.16", cycleMinutes: "18" },
      dark: { lossRate: "0.19", cycleMinutes: "21" },
    },
    roasterCapacityKg: "15",
    grindMinutesPerKg: { whole: "0", espresso: "3", filter: "2" },
    bagSizes: {
      "250g": {
        weightKg: "0.25",
        packagingCostCad: "0.85",
        packingMinutes: "0.5",
      },
      "1kg": {
        weightKg: "1",
        packagingCostCad: "1.60",
        packingMinutes: "0.75",
      },
      "5kg": { weightKg: "5", packagingCostCad: "3.50", packingMinutes: "1.5" },
    },
    hourlyRatesCad: { roasting: "32", grinding: "26", packing: "24" },
    overheadRate: "0.15",
    marginRate: "0.35",
    exchangeRatesCad: { USD: "1.36", EUR: "1.50", GBP: "1.72" },
    quoteValidityDays: "30",
  };
}

function validConfiguration() {
  return {
    originId: "ethiopia-yirgacheffe",
    roast: "medium",
    grind: "espresso",
    bagSize: "1kg",
    quantity: 24,
    currency: "CAD",
  };
}

type Path = readonly (string | number)[];

/** Returns a copy of `input` with the value at `path` replaced. */
function withValue<T>(input: T, path: Path, value: unknown): T {
  const copy = structuredClone(input);
  let target = copy as Record<string | number, unknown>;
  for (const key of path.slice(0, -1)) {
    target = target[key] as Record<string | number, unknown>;
  }
  target[path[path.length - 1]] = value;
  return copy;
}

function settingsErrors(path: Path, value: unknown) {
  const result = pricingSettingsSchema.safeParse(
    withValue(validSettings(), path, value),
  );
  return result.error?.issues.map(({ path, message }) => ({ path, message }));
}

function configurationErrors(path: Path, value: unknown) {
  const result = configurationSchema.safeParse(
    withValue(validConfiguration(), path, value),
  );
  return result.error?.issues.map(({ path, message }) => ({ path, message }));
}

describe("pricingSettingsSchema", () => {
  it("accepts the reference settings and outputs Decimals", () => {
    const settings = pricingSettingsSchema.parse(validSettings());

    expect(settings.greenCoffeeUsdPerKg["ethiopia-yirgacheffe"]).toEqual(
      new Decimal("8.40"),
    );
    expect(settings.roastProfiles.medium.lossRate).toEqual(new Decimal("0.16"));
    expect(settings.bagSizes["1kg"].packagingCostCad).toEqual(
      new Decimal("1.60"),
    );
    expect(settings.exchangeRatesCad.USD).toEqual(new Decimal("1.36"));
  });

  it("accepts numbers and Decimals as well as strings", () => {
    const fromNumber = pricingSettingsSchema.parse(
      withValue(validSettings(), ["marginRate"], 0.35),
    );
    const fromDecimal = pricingSettingsSchema.parse(
      withValue(validSettings(), ["marginRate"], new Decimal("0.35")),
    );

    expect(fromNumber.marginRate).toEqual(new Decimal("0.35"));
    expect(fromDecimal.marginRate).toEqual(new Decimal("0.35"));
  });

  describe("strictly positive values", () => {
    it.each([
      [["roastProfiles", "light", "cycleMinutes"], "Batch cycle time"],
      [["roasterCapacityKg"], "Roaster capacity"],
      [["bagSizes", "250g", "weightKg"], "Bag weight"],
      [["exchangeRatesCad", "USD"], "Exchange rate"],
    ] as const)("%j: rejects 0 and accepts 0.01", (path, label) => {
      expect(settingsErrors(path, "0")).toEqual([
        { path, message: `${label} must be greater than 0` },
      ]);
      expect(settingsErrors(path, "-1")).toEqual([
        { path, message: `${label} must be greater than 0` },
      ]);
      expect(settingsErrors(path, "0.01")).toBeUndefined();
    });
  });

  describe("values of 0 or more", () => {
    it.each([
      [["greenCoffeeUsdPerKg", "kenya-nyeri"], "Green coffee price"],
      [["grindMinutesPerKg", "filter"], "Grinding time"],
      [["bagSizes", "5kg", "packagingCostCad"], "Packaging cost"],
      [["bagSizes", "5kg", "packingMinutes"], "Packing time"],
      [["hourlyRatesCad", "packing"], "Hourly rate"],
    ] as const)("%j: rejects -0.01 and accepts 0", (path, label) => {
      expect(settingsErrors(path, "-0.01")).toEqual([
        { path, message: `${label} must be 0 or more` },
      ]);
      expect(settingsErrors(path, "0")).toBeUndefined();
    });
  });

  describe("rates from 0% to less than 100%", () => {
    it.each([
      [["roastProfiles", "dark", "lossRate"], "Loss rate"],
      [["overheadRate"], "Overhead"],
      [["marginRate"], "Margin"],
    ] as const)(
      "%j: accepts 0 and 0.9999, rejects -0.01 and 1",
      (path, label) => {
        expect(settingsErrors(path, "0")).toBeUndefined();
        expect(settingsErrors(path, "0.9999")).toBeUndefined();
        expect(settingsErrors(path, "-0.01")).toEqual([
          { path, message: `${label} must be 0% or more` },
        ]);
        expect(settingsErrors(path, "1")).toEqual([
          { path, message: `${label} must be less than 100%` },
        ]);
      },
    );
  });

  describe("quote validity, in whole days from 1 to 365", () => {
    it.each([["1"], ["365"]])("accepts %s", (value) => {
      expect(settingsErrors(["quoteValidityDays"], value)).toBeUndefined();
    });

    it.each([
      ["0", "Quote validity must be at least 1 day"],
      ["366", "Quote validity must be 365 days or less"],
      ["30.5", "Quote validity must be a whole number of days"],
      ["abc", "Quote validity must be a number"],
    ])("rejects %j", (value, message) => {
      expect(settingsErrors(["quoteValidityDays"], value)).toEqual([
        { path: ["quoteValidityDays"], message },
      ]);
    });
  });

  describe("non-numeric values", () => {
    it.each([["abc"], [""], ["Infinity"], [Number.NaN], [true], [null]])(
      "rejects %j",
      (value) => {
        expect(settingsErrors(["roasterCapacityKg"], value)).toEqual([
          {
            path: ["roasterCapacityKg"],
            message: "Roaster capacity must be a number",
          },
        ]);
      },
    );
  });

  describe("fixed lists", () => {
    it("rejects a missing origin", () => {
      const settings = validSettings();
      const origins: Partial<typeof settings.greenCoffeeUsdPerKg> =
        settings.greenCoffeeUsdPerKg;
      delete origins["kenya-nyeri"];

      expect(pricingSettingsSchema.safeParse(settings).success).toBe(false);
    });

    it("rejects an unknown origin", () => {
      expect(
        settingsErrors(["greenCoffeeUsdPerKg", "peru-cajamarca"], "6.00"),
      ).toHaveLength(1);
    });

    it("rejects a CAD exchange rate", () => {
      expect(settingsErrors(["exchangeRatesCad", "CAD"], "1")).toHaveLength(1);
    });
  });
});

describe("configurationSchema", () => {
  it("accepts the reference configuration", () => {
    expect(configurationSchema.parse(validConfiguration())).toEqual(
      validConfiguration(),
    );
  });

  describe("number of bags", () => {
    it.each([[1], [10_000]])("accepts %d", (quantity) => {
      expect(configurationErrors(["quantity"], quantity)).toBeUndefined();
    });

    it.each([
      [0, "Number of bags must be at least 1"],
      [10_001, "Number of bags must be 10,000 or less"],
      [2.5, "Number of bags must be a whole number"],
      ["24", "Number of bags must be a number"],
    ])("rejects %j", (quantity, message) => {
      expect(configurationErrors(["quantity"], quantity)).toEqual([
        { path: ["quantity"], message },
      ]);
    });
  });

  it.each([
    ["originId", "Choose a coffee from the list"],
    ["roast", "Choose a roast profile from the list"],
    ["grind", "Choose a grind from the list"],
    ["bagSize", "Choose a bag size from the list"],
    ["currency", "Choose a currency from the list"],
  ])("rejects an unknown %s", (field, message) => {
    expect(configurationErrors([field], "unknown")).toEqual([
      { path: [field], message },
    ]);
  });
});

describe("settings category schemas", () => {
  it("greenCoffeeCategorySchema accepts only greenCoffeeUsdPerKg", () => {
    const result = greenCoffeeCategorySchema.parse({
      greenCoffeeUsdPerKg: validSettings().greenCoffeeUsdPerKg,
    });

    expect(result.greenCoffeeUsdPerKg["kenya-nyeri"]).toEqual(
      new Decimal("9.60"),
    );
    expect(
      greenCoffeeCategorySchema.safeParse({
        greenCoffeeUsdPerKg: {
          ...validSettings().greenCoffeeUsdPerKg,
          "kenya-nyeri": "-1",
        },
      }).success,
    ).toBe(false);
  });

  it("roastingCategorySchema accepts roastProfiles and roasterCapacityKg", () => {
    const settings = validSettings();
    const result = roastingCategorySchema.parse({
      roastProfiles: settings.roastProfiles,
      roasterCapacityKg: settings.roasterCapacityKg,
    });

    expect(result.roasterCapacityKg).toEqual(new Decimal("15"));
    expect(
      roastingCategorySchema.safeParse({
        roastProfiles: settings.roastProfiles,
        roasterCapacityKg: "0",
      }).success,
    ).toBe(false);
  });

  it("packagingCategorySchema accepts cost and time per bag size, without weight", () => {
    const settings = validSettings();
    const result = packagingCategorySchema.parse({
      bagSizes: {
        "250g": {
          packagingCostCad: settings.bagSizes["250g"].packagingCostCad,
          packingMinutes: settings.bagSizes["250g"].packingMinutes,
        },
        "1kg": {
          packagingCostCad: settings.bagSizes["1kg"].packagingCostCad,
          packingMinutes: settings.bagSizes["1kg"].packingMinutes,
        },
        "5kg": {
          packagingCostCad: settings.bagSizes["5kg"].packagingCostCad,
          packingMinutes: settings.bagSizes["5kg"].packingMinutes,
        },
      },
    });

    expect(result.bagSizes["1kg"].packagingCostCad).toEqual(
      new Decimal("1.60"),
    );
    expect("weightKg" in result.bagSizes["1kg"]).toBe(false);
    expect(
      packagingCategorySchema.safeParse({
        bagSizes: {
          "250g": { packagingCostCad: "-1", packingMinutes: "0.5" },
        },
      }).success,
    ).toBe(false);
  });

  it("laborCategorySchema accepts hourlyRatesCad and grindMinutesPerKg", () => {
    const settings = validSettings();
    const result = laborCategorySchema.parse({
      hourlyRatesCad: settings.hourlyRatesCad,
      grindMinutesPerKg: settings.grindMinutesPerKg,
    });

    expect(result.hourlyRatesCad.roasting).toEqual(new Decimal("32"));
    expect(
      laborCategorySchema.safeParse({
        hourlyRatesCad: { ...settings.hourlyRatesCad, roasting: "-1" },
        grindMinutesPerKg: settings.grindMinutesPerKg,
      }).success,
    ).toBe(false);
  });

  it("overheadMarginCategorySchema accepts overheadRate and marginRate", () => {
    const result = overheadMarginCategorySchema.parse({
      overheadRate: "0.15",
      marginRate: "0.35",
    });

    expect(result.overheadRate).toEqual(new Decimal("0.15"));
    expect(
      overheadMarginCategorySchema.safeParse({
        overheadRate: "1",
        marginRate: "0.35",
      }).success,
    ).toBe(false);
  });

  it("currenciesCategorySchema accepts exchangeRatesCad", () => {
    const settings = validSettings();
    const result = currenciesCategorySchema.parse({
      exchangeRatesCad: settings.exchangeRatesCad,
    });

    expect(result.exchangeRatesCad.USD).toEqual(new Decimal("1.36"));
    expect(
      currenciesCategorySchema.safeParse({
        exchangeRatesCad: { ...settings.exchangeRatesCad, USD: "0" },
      }).success,
    ).toBe(false);
  });

  it("quotesCategorySchema accepts quoteValidityDays", () => {
    const result = quotesCategorySchema.parse({ quoteValidityDays: "45" });

    expect(result.quoteValidityDays).toBe(45);
    expect(
      quotesCategorySchema.safeParse({ quoteValidityDays: "0" }).success,
    ).toBe(false);
  });

  it("SETTINGS_CATEGORIES lists each category once", () => {
    expect(new Set(SETTINGS_CATEGORIES).size).toBe(SETTINGS_CATEGORIES.length);
  });
});
