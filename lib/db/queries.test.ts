import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { calculatePrice } from "@/lib/pricing";
import { pricingSettingsSchema } from "@/lib/pricing/validation";
import { db } from "./client";
import {
  createQuote,
  ensureSandbox,
  getQuoteByNumber,
  getSettings,
  listQuotes,
  purgeInactiveSandboxes,
  resetSettings,
  touchVisitorActivity,
  updateSettings,
} from "./queries";
import { quotes, settings, visitors } from "./schema";
import { defaultConfiguration, defaultSettings, sampleQuote } from "./seed";

// Integration tests: require a reachable DATABASE_URL with migrations
// applied (`npm run db:migrate`).
beforeEach(async () => {
  await db.delete(visitors);
});

describe("getSettings", () => {
  it("returns the defaults for a visitor with no sandbox", async () => {
    const result = await getSettings(randomUUID());

    expect(result).toEqual(defaultSettings());
  });

  it("returns the persisted settings for an existing sandbox", async () => {
    const visitorId = randomUUID();
    const customSettings = {
      ...defaultSettings(),
      overheadRate: new Decimal("0.2"),
    };
    await db.insert(visitors).values({ id: visitorId });
    await db.insert(settings).values({ visitorId, settings: customSettings });

    const result = await getSettings(visitorId);

    expect(result.overheadRate.toString()).toBe("0.2");
  });

  it("rejects a persisted settings row that fails validation", async () => {
    const visitorId = randomUUID();
    await db.insert(visitors).values({ id: visitorId });
    await db.insert(settings).values({ visitorId, settings: { bogus: true } });

    await expect(getSettings(visitorId)).rejects.toThrow();
  });
});

describe("ensureSandbox", () => {
  it("creates the visitor, default settings and sample quote rows", async () => {
    const visitorId = randomUUID();

    await ensureSandbox(visitorId);

    const visitor = await db.query.visitors.findFirst({
      where: eq(visitors.id, visitorId),
    });
    expect(visitor).toBeDefined();
    expect(await getSettings(visitorId)).toEqual(defaultSettings());

    const quoteRows = await db
      .select()
      .from(quotes)
      .where(eq(quotes.visitorId, visitorId));
    expect(quoteRows).toHaveLength(1);
    expect(quoteRows[0].number).toMatch(/^Q-\d{6}-0001$/);
  });

  it("does not overwrite an already-customized settings row or add a second quote", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);
    await db
      .update(settings)
      .set({
        settings: { ...defaultSettings(), overheadRate: new Decimal("0.5") },
      })
      .where(eq(settings.visitorId, visitorId));

    await ensureSandbox(visitorId);

    const result = await getSettings(visitorId);
    expect(result.overheadRate.toString()).toBe("0.5");
    const quoteRows = await db
      .select()
      .from(quotes)
      .where(eq(quotes.visitorId, visitorId));
    expect(quoteRows).toHaveLength(1);
  });

  it("is safe to call concurrently for the same visitor", async () => {
    const visitorId = randomUUID();

    await Promise.all([ensureSandbox(visitorId), ensureSandbox(visitorId)]);

    const rows = await db
      .select()
      .from(visitors)
      .where(eq(visitors.id, visitorId));
    expect(rows).toHaveLength(1);
    const quoteRows = await db
      .select()
      .from(quotes)
      .where(eq(quotes.visitorId, visitorId));
    expect(quoteRows).toHaveLength(1);
  });
});

describe("resetSettings", () => {
  it("restores a customized settings row to the defaults", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);
    await db
      .update(settings)
      .set({
        settings: { ...defaultSettings(), overheadRate: new Decimal("0.5") },
      })
      .where(eq(settings.visitorId, visitorId));

    await resetSettings(visitorId);

    expect(await getSettings(visitorId)).toEqual(defaultSettings());
  });

  it("creates the sandbox at the defaults for a visitor with none yet", async () => {
    const visitorId = randomUUID();

    await resetSettings(visitorId);

    expect(await getSettings(visitorId)).toEqual(defaultSettings());
    const visitor = await db.query.visitors.findFirst({
      where: eq(visitors.id, visitorId),
    });
    expect(visitor).toBeDefined();
  });

  it("does not touch the visitor's quotes", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);
    const before = await db
      .select()
      .from(quotes)
      .where(eq(quotes.visitorId, visitorId));

    await resetSettings(visitorId);

    const after = await db
      .select()
      .from(quotes)
      .where(eq(quotes.visitorId, visitorId));
    expect(after).toEqual(before);
  });
});

describe("updateSettings", () => {
  it("persists the given settings for an existing sandbox", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);
    const newSettings = {
      ...defaultSettings(),
      overheadRate: new Decimal("0.2"),
    };

    await updateSettings(visitorId, newSettings);

    const result = await getSettings(visitorId);
    expect(result.overheadRate.toString()).toBe("0.2");
  });

  it("creates the sandbox for a visitor with none yet", async () => {
    const visitorId = randomUUID();
    const newSettings = {
      ...defaultSettings(),
      marginRate: new Decimal("0.4"),
    };

    await updateSettings(visitorId, newSettings);

    const result = await getSettings(visitorId);
    expect(result.marginRate.toString()).toBe("0.4");
    const visitor = await db.query.visitors.findFirst({
      where: eq(visitors.id, visitorId),
    });
    expect(visitor).toBeDefined();
  });

  it("does not touch the visitor's quotes", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);
    const before = await db
      .select()
      .from(quotes)
      .where(eq(quotes.visitorId, visitorId));

    await updateSettings(visitorId, defaultSettings());

    const after = await db
      .select()
      .from(quotes)
      .where(eq(quotes.visitorId, visitorId));
    expect(after).toEqual(before);
  });
});

describe("touchVisitorActivity", () => {
  it("updates last_seen_at for a visitor inactive for more than a day", async () => {
    const visitorId = randomUUID();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await db.insert(visitors).values({ id: visitorId, lastSeenAt: twoDaysAgo });

    await touchVisitorActivity(visitorId);

    const [visitor] = await db
      .select()
      .from(visitors)
      .where(eq(visitors.id, visitorId));
    expect(visitor.lastSeenAt.getTime()).toBeGreaterThan(twoDaysAgo.getTime());
  });

  it("leaves last_seen_at untouched for a visitor seen today", async () => {
    const visitorId = randomUUID();
    const now = new Date();
    await db.insert(visitors).values({ id: visitorId, lastSeenAt: now });

    await touchVisitorActivity(visitorId);

    const [visitor] = await db
      .select()
      .from(visitors)
      .where(eq(visitors.id, visitorId));
    expect(visitor.lastSeenAt.getTime()).toBe(now.getTime());
  });

  it("is a no-op for a visitor with no sandbox", async () => {
    await expect(touchVisitorActivity(randomUUID())).resolves.not.toThrow();

    const rows = await db.select().from(visitors);
    expect(rows).toHaveLength(0);
  });
});

describe("purgeInactiveSandboxes", () => {
  // A fixed `now`, shared between the fixtures and the call under test: using
  // `Date.now()` independently in both would race by a few milliseconds and
  // make the exactly-30-days boundary test flaky.
  const now = new Date();
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  it("deletes a sandbox inactive for more than 30 days, cascading to its settings and quotes", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);
    await db
      .update(visitors)
      .set({ lastSeenAt: daysAgo(31) })
      .where(eq(visitors.id, visitorId));

    const count = await purgeInactiveSandboxes(now);

    expect(count).toBe(1);
    const visitor = await db.query.visitors.findFirst({
      where: eq(visitors.id, visitorId),
    });
    expect(visitor).toBeUndefined();
    const settingsRow = await db.query.settings.findFirst({
      where: eq(settings.visitorId, visitorId),
    });
    expect(settingsRow).toBeUndefined();
    const quoteRows = await db
      .select()
      .from(quotes)
      .where(eq(quotes.visitorId, visitorId));
    expect(quoteRows).toHaveLength(0);
  });

  it("leaves a sandbox inactive for exactly 30 days untouched", async () => {
    const visitorId = randomUUID();
    await db
      .insert(visitors)
      .values({ id: visitorId, lastSeenAt: daysAgo(30) });

    const count = await purgeInactiveSandboxes(now);

    expect(count).toBe(0);
    const visitor = await db.query.visitors.findFirst({
      where: eq(visitors.id, visitorId),
    });
    expect(visitor).toBeDefined();
  });

  it("leaves an active sandbox untouched", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);

    const count = await purgeInactiveSandboxes(now);

    expect(count).toBe(0);
    const visitor = await db.query.visitors.findFirst({
      where: eq(visitors.id, visitorId),
    });
    expect(visitor).toBeDefined();
  });

  it("returns the count of every inactive sandbox it deletes", async () => {
    const inactiveIds = [randomUUID(), randomUUID()];
    const activeId = randomUUID();
    for (const id of inactiveIds) {
      await db.insert(visitors).values({ id, lastSeenAt: daysAgo(45) });
    }
    await db.insert(visitors).values({ id: activeId });

    const count = await purgeInactiveSandboxes(now);

    expect(count).toBe(2);
    const rows = await db.select().from(visitors);
    expect(rows.map((row) => row.id)).toEqual([activeId]);
  });
});

describe("createQuote", () => {
  it("recalculates the price from the settings stored in the database", async () => {
    const visitorId = randomUUID();
    const configuration = { ...defaultConfiguration(), quantity: 10 };

    const saved = await createQuote(visitorId, {
      customerName: "Maple & Bean Café",
      notes: null,
      configuration,
    });

    const expected = calculatePrice(defaultSettings(), configuration);
    expect(saved.total).toBe(expected.total.toFixed(2));
    const [row] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.number, saved.number));
    expect(row.customerName).toBe("Maple & Bean Café");
    expect(row.currency).toBe(configuration.currency);
    expect(row.notes).toBeNull();
    expect(row.configuration).toEqual(configuration);
    expect(row.total).toBe(expected.total.toFixed(2));
  });

  it("creates the sandbox for a visitor with none yet", async () => {
    const visitorId = randomUUID();

    await createQuote(visitorId, {
      customerName: "The Daily Grind",
      notes: null,
      configuration: defaultConfiguration(),
    });

    const visitor = await db.query.visitors.findFirst({
      where: eq(visitors.id, visitorId),
    });
    expect(visitor).toBeDefined();
  });

  it("numbers a brand-new visitor's first real quote 0002, after the sample quote", async () => {
    const visitorId = randomUUID();

    const saved = await createQuote(visitorId, {
      customerName: "The Daily Grind",
      notes: null,
      configuration: defaultConfiguration(),
    });

    expect(saved.number).toMatch(/^Q-\d{6}-0002$/);
  });

  it("assigns consecutive numbers to two quotes saved the same day", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);

    const first = await createQuote(visitorId, {
      customerName: "The Daily Grind",
      notes: null,
      configuration: defaultConfiguration(),
    });
    const second = await createQuote(visitorId, {
      customerName: "Willow Street Café",
      notes: null,
      configuration: defaultConfiguration(),
    });

    const firstCounter = Number(first.number.slice(-4));
    const secondCounter = Number(second.number.slice(-4));
    expect(secondCounter).toBe(firstCounter + 1);
  });

  it("gives each visitor their own daily counter", async () => {
    const visitorA = randomUUID();
    const visitorB = randomUUID();
    await ensureSandbox(visitorA);
    await ensureSandbox(visitorB);

    const savedA = await createQuote(visitorA, {
      customerName: "The Daily Grind",
      notes: null,
      configuration: defaultConfiguration(),
    });
    const savedB = await createQuote(visitorB, {
      customerName: "Willow Street Café",
      notes: null,
      configuration: defaultConfiguration(),
    });

    expect(savedA.number).toBe(savedB.number);
  });

  it("sets valid_until to the creation date plus the settings' quoteValidityDays", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);
    await updateSettings(visitorId, {
      ...defaultSettings(),
      quoteValidityDays: 10,
    });

    const saved = await createQuote(visitorId, {
      customerName: "The Daily Grind",
      notes: null,
      configuration: defaultConfiguration(),
    });

    const [row] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.number, saved.number));
    const expectedMs = row.createdAt.getTime() + 10 * 24 * 60 * 60 * 1000;
    expect(saved.validUntil.getTime()).toBe(expectedMs);
    expect(row.validUntil.getTime()).toBe(expectedMs);
  });

  it("is not changed by a later settings change or reset", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);
    const configuration = defaultConfiguration();

    const saved = await createQuote(visitorId, {
      customerName: "The Daily Grind",
      notes: null,
      configuration,
    });
    await updateSettings(visitorId, {
      ...defaultSettings(),
      marginRate: new Decimal("0.9"),
    });

    const expected = calculatePrice(defaultSettings(), configuration);
    const afterChange = (
      await db.select().from(quotes).where(eq(quotes.number, saved.number))
    )[0];
    expect(afterChange.total).toBe(expected.total.toFixed(2));
    expect(pricingSettingsSchema.parse(afterChange.settingsSnapshot)).toEqual(
      defaultSettings(),
    );

    await resetSettings(visitorId);

    const afterReset = (
      await db.select().from(quotes).where(eq(quotes.number, saved.number))
    )[0];
    expect(afterReset.total).toBe(expected.total.toFixed(2));
    expect(pricingSettingsSchema.parse(afterReset.settingsSnapshot)).toEqual(
      defaultSettings(),
    );
  });

  it("stores notes when given, and null when omitted", async () => {
    const visitorId = randomUUID();
    await ensureSandbox(visitorId);

    const saved = await createQuote(visitorId, {
      customerName: "The Daily Grind",
      notes: "Deliver before Friday.",
      configuration: defaultConfiguration(),
    });

    const [row] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.number, saved.number));
    expect(row.notes).toBe("Deliver before Friday.");
  });
});

describe("listQuotes", () => {
  it("falls back to the virtual sample quote for a visitor with no sandbox", async () => {
    const sample = sampleQuote();

    const result = await listQuotes(randomUUID());

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      number: sample.number,
      customerName: sample.customerName,
      currency: sample.currency,
      total: sample.total,
    });
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });

  it("returns the visitor's quotes, most recent first", async () => {
    const visitorId = randomUUID();
    await db.insert(visitors).values({ id: visitorId });
    const older = sampleQuote(new Date("2026-03-01T12:00:00Z"));
    const newer = sampleQuote(new Date("2026-03-02T12:00:00Z"));
    await db.insert(quotes).values({
      visitorId,
      ...older,
      number: "Q-260301-0001",
      customerName: "Older Café",
    });
    await db.insert(quotes).values({
      visitorId,
      ...newer,
      number: "Q-260302-0001",
      customerName: "Newer Café",
    });

    const result = await listQuotes(visitorId);

    expect(result.map((q) => q.customerName)).toEqual([
      "Newer Café",
      "Older Café",
    ]);
    expect(result[0]).toMatchObject({
      number: "Q-260302-0001",
      currency: newer.currency,
      total: newer.total,
    });
  });

  it("does not return another visitor's quotes", async () => {
    const visitorId = randomUUID();
    const otherVisitorId = randomUUID();
    await ensureSandbox(visitorId);
    await ensureSandbox(otherVisitorId);

    const result = await listQuotes(visitorId);

    expect(result).toHaveLength(1);
  });
});

describe("getQuoteByNumber", () => {
  it("returns the visitor's quote with a rehydrated result snapshot", async () => {
    const visitorId = randomUUID();
    const configuration = defaultConfiguration();
    const saved = await createQuote(visitorId, {
      customerName: "The Daily Grind",
      notes: "Deliver before Friday.",
      configuration,
    });

    const result = await getQuoteByNumber(visitorId, saved.number);

    expect(result).not.toBeNull();
    expect(result?.customerName).toBe("The Daily Grind");
    expect(result?.notes).toBe("Deliver before Friday.");
    expect(result?.configuration).toEqual(configuration);
    expect(result?.resultSnapshot).toEqual(
      calculatePrice(defaultSettings(), configuration),
    );
  });

  it("falls back to the virtual sample quote for a visitor with no sandbox", async () => {
    const sample = sampleQuote();

    const result = await getQuoteByNumber(randomUUID(), sample.number);

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      number: sample.number,
      customerName: sample.customerName,
      notes: sample.notes,
      currency: sample.currency,
      configuration: sample.configuration,
      resultSnapshot: sample.resultSnapshot,
    });
    expect(result?.createdAt).toBeInstanceOf(Date);
    expect(result?.validUntil).toBeInstanceOf(Date);
  });

  it("returns null for a number that doesn't exist", async () => {
    const result = await getQuoteByNumber(randomUUID(), "Q-260305-0001");

    expect(result).toBeNull();
  });

  it("returns null for another visitor's quote", async () => {
    const ownerId = randomUUID();
    const otherId = randomUUID();
    const saved = await createQuote(ownerId, {
      customerName: "The Daily Grind",
      notes: null,
      configuration: defaultConfiguration(),
    });

    const result = await getQuoteByNumber(otherId, saved.number);

    expect(result).toBeNull();
  });
});
