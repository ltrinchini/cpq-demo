import { and, count, desc, eq, like, lt } from "drizzle-orm";
import { calculatePrice } from "@/lib/pricing";
import type { Configuration, Currency, PriceResult } from "@/lib/pricing/types";
import {
  configurationSchema,
  priceResultSchema,
  pricingSettingsSchema,
} from "@/lib/pricing/validation";
import { nextQuoteNumber, quoteNumberPrefix } from "@/lib/quote-number";
import { db } from "./client";
import { quotes, settings, visitors } from "./schema";
import { defaultSettings, sampleQuote } from "./seed";
import type { PricingSettings } from "@/lib/pricing/types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const PURGE_AFTER_DAYS = 30;

const UNIQUE_VIOLATION = "23505";
const MAX_NUMBER_ATTEMPTS = 20;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

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

/** Fields the visitor supplies to save a quote. */
export interface SaveQuoteInput {
  customerName: string;
  notes: string | null;
  configuration: Configuration;
}

/** What the visitor needs back after saving: enough to show a confirmation. */
export interface SavedQuote {
  number: string;
  total: string;
  validUntil: Date;
}

/**
 * Freezes `input.configuration` as a quote: recalculates the price from the
 * settings stored in the database (never trusting an amount sent by the
 * browser) and snapshots both, so a later rate change or reset never
 * changes this quote (`docs/project.md`, "Quotes"). Creates the sandbox
 * first if it doesn't exist yet.
 *
 * The `Q-YYMMDD-XXXX` number is assigned inside the same transaction, from
 * a count of the visitor's quotes for the day; on the unique constraint
 * rejecting a race with another save, the next number is retried.
 */
export async function createQuote(
  visitorId: string,
  input: SaveQuoteInput,
): Promise<SavedQuote> {
  await ensureSandbox(visitorId);
  const now = new Date();
  const prefix = quoteNumberPrefix(now);

  return db.transaction(async (tx) => {
    const settingsRow = await tx.query.settings.findFirst({
      where: eq(settings.visitorId, visitorId),
    });
    const currentSettings = pricingSettingsSchema.parse(settingsRow!.settings);
    const resultSnapshot = calculatePrice(currentSettings, input.configuration);
    const total = resultSnapshot.total.toFixed(2);
    const validUntil = new Date(
      now.getTime() + currentSettings.quoteValidityDays * ONE_DAY_MS,
    );

    const [{ value: quotesTodayCount }] = await tx
      .select({ value: count() })
      .from(quotes)
      .where(
        and(eq(quotes.visitorId, visitorId), like(quotes.number, `${prefix}%`)),
      );

    for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt++) {
      const number = nextQuoteNumber(now, quotesTodayCount + attempt);
      try {
        await tx.insert(quotes).values({
          visitorId,
          number,
          customerName: input.customerName,
          currency: input.configuration.currency,
          notes: input.notes,
          configuration: input.configuration,
          settingsSnapshot: currentSettings,
          resultSnapshot,
          total,
          createdAt: now,
          validUntil,
        });
        return { number, total, validUntil };
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw new Error(
      `Could not assign a quote number for visitor ${visitorId} after ${MAX_NUMBER_ATTEMPTS} attempts.`,
    );
  });
}

/** One row of the `/quotes` list (`docs/design.md`, "Quotes"). */
export interface QuoteListItem {
  number: string;
  customerName: string;
  currency: Currency;
  total: string;
  createdAt: Date;
}

/**
 * The visitor's quotes, most recent first. Before any sandbox exists,
 * falls back to the virtual sample quote (`lib/db/seed.ts`, `sampleQuote`)
 * so the list is never empty on a first visit (`docs/project.md`). Never
 * writes.
 */
export async function listQuotes(visitorId: string): Promise<QuoteListItem[]> {
  const rows = await db
    .select({
      number: quotes.number,
      customerName: quotes.customerName,
      currency: quotes.currency,
      total: quotes.total,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .where(eq(quotes.visitorId, visitorId))
    .orderBy(desc(quotes.createdAt));
  if (rows.length > 0) return rows;

  const sample = sampleQuote();
  return [
    {
      number: sample.number,
      customerName: sample.customerName,
      currency: sample.currency,
      total: sample.total,
      createdAt: sample.createdAt,
    },
  ];
}

/** A quote's full frozen content, for the `/quotes/[number]` preview. */
export interface QuoteDetail {
  number: string;
  customerName: string;
  notes: string | null;
  currency: Currency;
  configuration: Configuration;
  resultSnapshot: PriceResult;
  createdAt: Date;
  validUntil: Date;
}

/**
 * A visitor's quote by number, or `null` if it doesn't exist or belongs to
 * another visitor (every query filtered by visitor ID, `CLAUDE.md`,
 * "Security"). Rehydrates the frozen `resultSnapshot` back into `Decimal`s.
 * Before any sandbox exists, falls back to the virtual sample quote
 * (`lib/db/seed.ts`, `sampleQuote`) if `number` matches it, so the first
 * visit's preview is never a dead link (`docs/project.md`). Never writes.
 */
export async function getQuoteByNumber(
  visitorId: string,
  number: string,
): Promise<QuoteDetail | null> {
  const row = await db.query.quotes.findFirst({
    where: and(eq(quotes.visitorId, visitorId), eq(quotes.number, number)),
  });
  if (!row) {
    const sample = sampleQuote();
    if (sample.number !== number) return null;

    return {
      number: sample.number,
      customerName: sample.customerName,
      notes: sample.notes,
      currency: sample.currency,
      configuration: sample.configuration,
      resultSnapshot: sample.resultSnapshot,
      createdAt: sample.createdAt,
      validUntil: sample.validUntil,
    };
  }

  return {
    number: row.number,
    customerName: row.customerName,
    notes: row.notes,
    currency: row.currency,
    configuration: configurationSchema.parse(row.configuration),
    resultSnapshot: priceResultSchema.parse(row.resultSnapshot),
    createdAt: row.createdAt,
    validUntil: row.validUntil,
  };
}
