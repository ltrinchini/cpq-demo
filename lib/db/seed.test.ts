import { describe, expect, it } from "vitest";
import { calculatePrice } from "@/lib/pricing";
import {
  configurationSchema,
  pricingSettingsSchema,
} from "@/lib/pricing/validation";
import {
  DEMO_CUSTOMER_NAMES,
  QUOTE_VALIDITY_DAYS,
  defaultConfiguration,
  defaultSettings,
  sampleQuote,
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

describe("sampleQuote", () => {
  it("prices the default configuration with the default settings", () => {
    const quote = sampleQuote(new Date("2026-03-05T12:00:00Z"));

    expect(quote.configuration).toEqual(defaultConfiguration());
    expect(quote.settingsSnapshot).toEqual(defaultSettings());
    expect(quote.resultSnapshot).toEqual(
      calculatePrice(defaultSettings(), defaultConfiguration()),
    );
    expect(quote.total).toBe(quote.resultSnapshot.total.toFixed(2));
    expect(quote.currency).toBe(defaultConfiguration().currency);
  });

  it("is the first quote of the day, numbered from the America/Toronto date", () => {
    // 2026-03-05T04:30:00Z is still 2026-03-04 evening in Toronto (EST, UTC-5).
    const quote = sampleQuote(new Date("2026-03-05T04:30:00Z"));

    expect(quote.number).toBe("Q-260304-0001");
  });

  it("is valid for QUOTE_VALIDITY_DAYS from its creation date", () => {
    const createdAt = new Date("2026-03-05T12:00:00Z");
    const quote = sampleQuote(createdAt);

    const expectedMs =
      createdAt.getTime() + QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
    expect(quote.validUntil.getTime()).toBe(expectedMs);
  });

  it("prefills a fictional customer name and no notes", () => {
    const quote = sampleQuote();

    expect(DEMO_CUSTOMER_NAMES).toContain(quote.customerName);
    expect(quote.notes).toBeNull();
  });

  it("defaults to the current date when none is given", () => {
    const before = Date.now();
    const quote = sampleQuote();
    const after = Date.now();

    expect(quote.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(quote.createdAt.getTime()).toBeLessThanOrEqual(after);
  });
});
