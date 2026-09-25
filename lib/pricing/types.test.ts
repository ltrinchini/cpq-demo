import { describe, expect, it } from "vitest";
import {
  BAG_SIZES,
  COST_LINES,
  CURRENCIES,
  GRINDS,
  ORIGINS,
  ROAST_PROFILES,
  STATIONS,
} from "./types";

describe("fixed lists", () => {
  it.each([
    [
      "origins",
      ORIGINS,
      [
        "ethiopia-yirgacheffe",
        "colombia-huila",
        "brazil-cerrado",
        "guatemala-antigua",
        "kenya-nyeri",
      ],
    ],
    ["roast profiles", ROAST_PROFILES, ["light", "medium", "dark"]],
    ["grinds", GRINDS, ["whole", "espresso", "filter"]],
    ["bag sizes", BAG_SIZES, ["250g", "1kg", "5kg"]],
    ["stations", STATIONS, ["roasting", "grinding", "packing"]],
    ["currencies", CURRENCIES, ["CAD", "USD", "EUR", "GBP"]],
    [
      "cost lines",
      COST_LINES,
      ["greenCoffee", "packaging", "labor", "overhead", "margin"],
    ],
  ])("lists the %s in order", (_name, list, expected) => {
    expect(list).toEqual(expected);
  });
});
