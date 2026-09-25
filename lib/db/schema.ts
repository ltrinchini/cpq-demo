import {
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { CURRENCIES } from "@/lib/pricing/types";

export const currencyEnum = pgEnum("currency", CURRENCIES);

/**
 * One row per anonymous visitor. Created lazily, on the first write
 * (a settings change or a saved quote): a visit alone creates nothing.
 */
export const visitors = pgTable("visitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /** Updated at most once a day; used by the purge job. */
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * One row per visitor (1:1). `settings` is validated against
 * `pricingSettingsSchema` (see lib/pricing/validation.ts) at read time.
 */
export const settings = pgTable("settings", {
  visitorId: uuid("visitor_id")
    .primaryKey()
    .references(() => visitors.id, { onDelete: "cascade" }),
  settings: jsonb("settings").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A quote is frozen at save time: `settingsSnapshot` and `resultSnapshot`
 * keep the settings and breakdown used, so a later rate change or reset
 * never changes it. Amounts in `resultSnapshot` are decimal strings.
 */
export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    /** `Q-YYMMDD-XXXX`, per-visitor counter restarting at 0001 each day. */
    number: text("number").notNull(),
    customerName: text("customer_name").notNull(),
    currency: currencyEnum("currency").notNull(),
    notes: text("notes"),
    configuration: jsonb("configuration").notNull(),
    settingsSnapshot: jsonb("settings_snapshot").notNull(),
    resultSnapshot: jsonb("result_snapshot").notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  },
  (table) => [unique().on(table.visitorId, table.number)],
);
