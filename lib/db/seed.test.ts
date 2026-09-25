import { describe, expect, it } from "vitest";
import {
  configurationSchema,
  pricingSettingsSchema,
} from "@/lib/pricing/validation";
import {
  DEMO_CUSTOMER_NAMES,
  QUOTE_VALIDITY_DAYS,
  defaultConfiguration,
  defaultSettings,
} from "./seed";

describe("defaultSettings", () => {
  it("passes the pricing settings Zod schema", () => {
    expect(pricingSettingsSchema.safeParse(defaultSettings()).success).toBe(
      true,
    );
  });
});

describe("defaultConfiguration", () => {
  it("passes the configuration Zod schema", () => {
    expect(configurationSchema.safeParse(defaultConfiguration()).success).toBe(
      true,
    );
  });
});

describe("DEMO_CUSTOMER_NAMES", () => {
  it("is a non-empty list of distinct names", () => {
    expect(DEMO_CUSTOMER_NAMES.length).toBeGreaterThan(0);
    expect(new Set(DEMO_CUSTOMER_NAMES).size).toBe(DEMO_CUSTOMER_NAMES.length);
  });
});

describe("QUOTE_VALIDITY_DAYS", () => {
  it("matches the 30-day default from the spec", () => {
    expect(QUOTE_VALIDITY_DAYS).toBe(30);
  });
});
