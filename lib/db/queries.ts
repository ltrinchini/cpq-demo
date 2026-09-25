import { and, eq, lt } from "drizzle-orm";
import { db } from "./client";
import { quotes, settings, visitors } from "./schema";
import { defaultSettings, sampleQuote } from "./seed";
import type { PricingSettings } from "@/lib/pricing/types";
import { pricingSettingsSchema } from "@/lib/pricing/validation";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const PURGE_AFTER_DAYS = 30;

/**
 * The visitor's settings, from the database if their sandbox exists,
 * from the in-memory defaults otherwise. Never writes.
 */
export async function getSettings(visitorId: string): Promise<PricingSettings> {
  const row = await db.query.settings.findFirst({
    where: eq(settings.visitorId, visitorId),
  });
  if (!row) return defaultSettings();

  return pricingSettingsSchema.parse(row.settings);
}

/**
 * Creates the visitor's sandbox (visitor row, default settings and the
 * sample quote) if it doesn't exist yet. Call before a settings change or
 * a saved quote — the only two writes allowed to create a sandbox. Gated
 * on the visitor row actually being inserted, so a sandbox is created at
 * most once and repeat calls (including concurrent ones) never touch an
 * existing sandbox's settings or insert a second sample quote.
 */
export async function ensureSandbox(visitorId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(visitors)
      .values({ id: visitorId })
      .onConflictDoNothing()
      .returning({ id: visitors.id });
    if (inserted.length === 0) return;

    await tx
      .insert(settings)
      .values({ visitorId, settings: defaultSettings() });
    await tx.insert(quotes).values({ visitorId, ...sampleQuote() });
  });
}

/**
 * Writes the visitor's settings. Creates the sandbox first if it doesn't
 * exist yet, so this always leaves a settings row with the given value.
 */
async function writeSettings(
  visitorId: string,
  newSettings: PricingSettings,
): Promise<void> {
  await ensureSandbox(visitorId);
  await db
    .update(settings)
    .set({ settings: newSettings, updatedAt: new Date() })
    .where(eq(settings.visitorId, visitorId));
}

/**
 * Restores the visitor's settings to their defaults. Never touches quotes:
 * a quote is frozen at save time and keeps its own settings snapshot, so
 * resetting never changes one.
 */
export async function resetSettings(visitorId: string): Promise<void> {
  await writeSettings(visitorId, defaultSettings());
}

/**
 * Saves the visitor's settings as given (e.g. after merging a validated
 * settings category). Same creation-on-write behaviour as `resetSettings`.
 */
export async function updateSettings(
  visitorId: string,
  newSettings: PricingSettings,
): Promise<void> {
  await writeSettings(visitorId, newSettings);
}

/**
 * Marks the visitor as active today, at most once a day. A visitor with no
 * sandbox yet matches nothing and stays that way: this never creates a row.
 */
export async function touchVisitorActivity(visitorId: string): Promise<void> {
  const oneDayAgo = new Date(Date.now() - ONE_DAY_MS);

  await db
    .update(visitors)
    .set({ lastSeenAt: new Date() })
    .where(and(eq(visitors.id, visitorId), lt(visitors.lastSeenAt, oneDayAgo)));
}

/**
 * Deletes sandboxes (visitor, settings and quotes, via cascade) inactive
 * for more than 30 days. Returns the number of sandboxes deleted.
 */
export async function purgeInactiveSandboxes(
  now = new Date(),
): Promise<number> {
  const cutoff = new Date(now.getTime() - PURGE_AFTER_DAYS * ONE_DAY_MS);

  const deleted = await db
    .delete(visitors)
    .where(lt(visitors.lastSeenAt, cutoff))
    .returning({ id: visitors.id });

  return deleted.length;
}
