# 002 — Tasks

- [x] 1. Install Drizzle, `drizzle-kit` and the Postgres driver; `db:generate`, `db:migrate`, `db:seed` and `db:purge` scripts; `docker-compose.yml` with Postgres; `.env.example`.
- [x] 2. `visitors`, `settings`, `quotes` schema and first migration.
- [x] 3. `lib/db/seed.ts`: defaults (settings, default configuration, fictional customer names, validity). Test: the defaults pass Zod validation.
- [x] 4. `lib/visitor.ts`: read and set the cookie.
- [x] 5. Queries: read settings (database or defaults), create the sandbox on first write, update activity. Tests.
- [x] 6. Sample quote, virtual and then inserted when the sandbox is created. Tests.
- [x] 7. Settings reset without touching quotes. Tests.
- [x] 8. Purge script and daily scheduled job in `docker-compose.yml`. Tests.
