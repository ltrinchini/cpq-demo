import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./client";
import { ensureSandbox, getSettings, touchVisitorActivity } from "./queries";
import { settings, visitors } from "./schema";
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
  it("creates the visitor and default settings rows", async () => {
    const visitorId = randomUUID();

    await ensureSandbox(visitorId);

    const visitor = await db.query.visitors.findFirst({
      where: eq(visitors.id, visitorId),
    });
    expect(visitor).toBeDefined();
    expect(await getSettings(visitorId)).toEqual(defaultSettings());
  });

  it("does not overwrite an already-customized settings row", async () => {
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
  });

  it("is safe to call concurrently for the same visitor", async () => {
    const visitorId = randomUUID();

    await Promise.all([ensureSandbox(visitorId), ensureSandbox(visitorId)]);

    const rows = await db
      .select()
      .from(visitors)
      .where(eq(visitors.id, visitorId));
    expect(rows).toHaveLength(1);
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
