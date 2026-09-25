import { describe, expect, it } from "vitest";
import { referenceSettings } from "@/lib/pricing/test-fixtures";
import { toSettingsFormValues } from "./types";

describe("toSettingsFormValues", () => {
  it("converts every Decimal leaf to a string, and keeps quoteValidityDays a number", () => {
    const values = toSettingsFormValues(referenceSettings());

    expect(values.greenCoffeeUsdPerKg["ethiopia-yirgacheffe"]).toBe("8.4");
    expect(values.roastProfiles.medium).toEqual({
      lossRate: "0.16",
      cycleMinutes: "18",
    });
    expect(values.bagSizes["1kg"]).toEqual({
      weightKg: "1",
      packagingCostCad: "1.6",
      packingMinutes: "0.75",
    });
    expect(values.exchangeRatesCad.USD).toBe("1.36");
    expect(values.quoteValidityDays).toBe(30);
  });
});
