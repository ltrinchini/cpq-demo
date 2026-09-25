# 002 — Data and per-visitor sandbox

## Goal

Give each visitor a private, anonymous sandbox, prefilled with demo data, without writing anything to the database until they change something.

## Scope

- **Identification** (`lib/visitor.ts`): `httpOnly`, `secure`, `sameSite=lax` cookie holding a random ID (UUID), set on the first visit.
- **Defaults** (`lib/db/seed.ts`): reference settings from `specs/001-pricing-engine/spec.md`, the configurator's default configuration, a list of fictional customer names to prefill quotes, quote validity (30 days).
- **Lazy creation**: as long as the visitor has no sandbox in the database, the application reads the defaults from memory. The sandbox (settings and sample quote) is created on the first write: a settings change or a saved quote. Preview bots therefore create nothing.
- **Sample quote**: calculated from the defaults and shown in the list before the sandbox exists; actually inserted when the sandbox is created.
- **Drizzle schema** (`lib/db/schema.ts`), indicative:
  - `visitors`: `id`, `created_at`, `last_seen_at`;
  - `settings`: `visitor_id`, settings as `jsonb` validated by the Zod schemas in `lib/pricing/validation.ts`, `updated_at`;
  - `quotes`: `id`, `visitor_id`, `number`, `customer_name`, `currency`, `notes`, `configuration` (`jsonb`), `settings_snapshot` (`jsonb`), `result_snapshot` (`jsonb`, amounts as decimal strings), `total` (`numeric`), `created_at`, `valid_until`. Unique constraint on (`visitor_id`, `number`).
- **Activity**: `last_seen_at` updated at most once a day per visitor.
- **Reset**: restores the settings to their defaults; quotes are not touched (they are frozen).
- **Purge**: `npm run db:purge` script, which deletes sandboxes (settings and quotes) inactive for 30 days. A scheduled job in `docker-compose.yml` runs it every day.

## Acceptance criteria

- A visit without any change creates no database row.
- The first change creates the sandbox with the defaults and the sample quote.
- Two different browsers have independent data.
- Reset deletes no quote.
- The purge only deletes sandboxes inactive for more than 30 days (tested).

## Dependencies

001 (settings types and validation).
