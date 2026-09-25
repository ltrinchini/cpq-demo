import { and, eq, lt } from "drizzle-orm";
import { db } from "./client";
import { settings, visitors } from "./schema";
import { defaultSettings } from "./seed";
import type { PricingSettings } from "@/lib/pricing/types";
import { pricingSettingsSchema } from "@/lib/pricing/validation";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
 * Creates the visitor's sandbox (visitor row and default settings) if it
 * doesn't exist yet. Call before a settings change or a saved quote — the
 * only two writes allowed to create a sandbox. Idempotent: never overwrites
 * an existing settings row, so it is safe to call before every write.
 */
export async function ensureSandbox(visitorId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(visitors).values({ id: visitorId }).onConflictDoNothing();
    await tx
      .insert(settings)
      .values({ visitorId, settings: defaultSettings() })
      .onConflictDoNothing();
  });
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
