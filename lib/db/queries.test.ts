import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./client";
import {
  ensureSandbox,
  getSettings,
  purgeInactiveSandboxes,
  resetSettings,
  touchVisitorActivity,
  updateSettings,
} from "./queries";
import { quotes, settings, visitors } from "./schema";
import { defaultSettings } from "./seed";

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
