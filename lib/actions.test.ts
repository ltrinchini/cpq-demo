import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDemoData, saveQuote, saveSettingsCategory } from "./actions";
import { db } from "./db/client";
import { getSettings } from "./db/queries";
import { quotes, visitors } from "./db/schema";
import { defaultConfiguration, defaultSettings } from "./db/seed";
import { VISITOR_COOKIE_NAME } from "./visitor";

// Integration tests: require a reachable DATABASE_URL with migrations
// applied (`npm run db:migrate`).

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

async function mockVisitorCookie(visitorId: string | undefined): Promise<void> {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      visitorId !== undefined && name === VISITOR_COOKIE_NAME
        ? { name, value: visitorId }
        : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
}

beforeEach(async () => {
  await db.delete(visitors);
});

describe("saveSettingsCategory", () => {
  it("saves a valid greenCoffee category, leaving other fields untouched", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    const result = await saveSettingsCategory("greenCoffee", {
      greenCoffeeUsdPerKg: {
        ...defaultSettings().greenCoffeeUsdPerKg,
        "kenya-nyeri": "10.00",
      },
    });

    expect(result).toEqual({ success: true });
    const settings = await getSettings(visitorId);
    expect(settings.greenCoffeeUsdPerKg["kenya-nyeri"]).toEqual(
      new Decimal("10.00"),
    );
    expect(settings.overheadRate).toEqual(defaultSettings().overheadRate);
  });

  it("merges the packaging category without touching bag weight", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    const result = await saveSettingsCategory("packaging", {
      bagSizes: {
        "250g": { packagingCostCad: "1.00", packingMinutes: "0.5" },
        "1kg": { packagingCostCad: "2.00", packingMinutes: "0.75" },
        "5kg": { packagingCostCad: "4.00", packingMinutes: "1.5" },
      },
    });

    expect(result).toEqual({ success: true });
    const settings = await getSettings(visitorId);
    expect(settings.bagSizes["1kg"].packagingCostCad).toEqual(
      new Decimal("2.00"),
    );
    expect(settings.bagSizes["1kg"].weightKg).toEqual(
      defaultSettings().bagSizes["1kg"].weightKg,
    );
  });

  it("saves the quotes category", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    const result = await saveSettingsCategory("quotes", {
      quoteValidityDays: "45",
    });

    expect(result).toEqual({ success: true });
    const settings = await getSettings(visitorId);
    expect(settings.quoteValidityDays).toBe(45);
    expect(settings.overheadRate).toEqual(defaultSettings().overheadRate);
  });

  it("creates the sandbox on the visitor's first saved category", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    await saveSettingsCategory("currencies", {
      exchangeRatesCad: { USD: "1.40", EUR: "1.50", GBP: "1.72" },
    });

    const visitor = await db.query.visitors.findFirst({
      where: eq(visitors.id, visitorId),
    });
    expect(visitor).toBeDefined();
  });

  it("rejects an out-of-bounds value with a message per field, and saves nothing", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    const result = await saveSettingsCategory("overheadMargin", {
      overheadRate: "0.15",
      marginRate: "1",
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: { marginRate: "Margin must be less than 100%" },
    });
    const settings = await getSettings(visitorId);
    expect(settings).toEqual(defaultSettings());
  });

  it("rejects data for a different category's shape", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    const result = await saveSettingsCategory("currencies", {
      overheadRate: "0.2",
    });

    expect(result.success).toBe(false);
  });

  it("returns a root error when the visitor cannot be identified", async () => {
    await mockVisitorCookie(undefined);

    const result = await saveSettingsCategory("overheadMargin", {
      overheadRate: "0.1",
      marginRate: "0.3",
    });

    expect(result.success).toBe(false);
  });
});

describe("resetDemoData", () => {
  it("restores customized settings to their defaults", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);
    await saveSettingsCategory("overheadMargin", {
      overheadRate: "0.5",
      marginRate: "0.4",
    });

    const result = await resetDemoData();

    expect(result).toEqual({ success: true });
    const settings = await getSettings(visitorId);
    expect(settings).toEqual(defaultSettings());
  });

  it("returns an error when the visitor cannot be identified", async () => {
    await mockVisitorCookie(undefined);

    const result = await resetDemoData();

    expect(result.success).toBe(false);
  });
});

describe("saveQuote", () => {
  it("saves a valid quote and returns its number", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    const result = await saveQuote({
      customerName: "Maple & Bean Café",
      configuration: defaultConfiguration(),
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    expect(result.number).toMatch(/^Q-\d{6}-\d{4}$/);
    const row = await db.query.quotes.findFirst({
      where: eq(quotes.number, result.number),
    });
    expect(row?.customerName).toBe("Maple & Bean Café");
  });

  it("trims the customer name and stores optional notes", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    const result = await saveQuote({
      customerName: "  The Daily Grind  ",
      notes: "Deliver before Friday.",
      configuration: defaultConfiguration(),
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    const row = await db.query.quotes.findFirst({
      where: eq(quotes.number, result.number),
    });
    expect(row?.customerName).toBe("The Daily Grind");
    expect(row?.notes).toBe("Deliver before Friday.");
  });

  it("rejects an empty customer name and saves nothing", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    const result = await saveQuote({
      customerName: "   ",
      configuration: defaultConfiguration(),
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: { customerName: "Customer name is required" },
    });
    const rows = await db
      .select()
      .from(quotes)
      .where(eq(quotes.visitorId, visitorId));
    expect(rows).toHaveLength(0);
  });

  it("rejects an invalid configuration", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    const result = await saveQuote({
      customerName: "The Daily Grind",
      configuration: { ...defaultConfiguration(), quantity: 0 },
    });

    expect(result.success).toBe(false);
  });

  it("returns a root error when the visitor cannot be identified", async () => {
    await mockVisitorCookie(undefined);

    const result = await saveQuote({
      customerName: "The Daily Grind",
      configuration: defaultConfiguration(),
    });

    expect(result.success).toBe(false);
  });

  it("recalculates the price on the server, ignoring any amount sent by the client", async () => {
    const visitorId = randomUUID();
    await mockVisitorCookie(visitorId);

    const result = await saveQuote({
      customerName: "The Daily Grind",
      configuration: defaultConfiguration(),
      total: "999999.99",
    } as unknown as Parameters<typeof saveQuote>[0]);

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    const row = await db.query.quotes.findFirst({
      where: eq(quotes.number, result.number),
    });
    expect(row?.total).not.toBe("999999.99");
  });
});
