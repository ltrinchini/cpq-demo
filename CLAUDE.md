# CPQ — Coffee roastery

Public CPQ demo for a fictional coffee roastery.
Vision, pricing rules and scope: see `docs/project.md`.
Visual rules, formats and mobile responsiveness: see `docs/design.md` (read before any UI or PDF work).
Feature order: see `docs/roadmap.md`.

## Stack

- Next.js 16 (App Router), TypeScript in strict mode
- PostgreSQL + Drizzle ORM: local Postgres server in development, Postgres in Docker (`docker-compose.yml`) in deployment
- Tailwind CSS 4, shadcn/ui components (`components/ui/`)
- Validation: Zod
- Amounts: `decimal.js`, never `number` for money (to install)
- PDF: `@react-pdf/renderer` (to install)
- Tests: Vitest (to install)

## Commands

- Dev: `npm run dev`
- Lint: `npm run lint`
- Format: `npm run format` (Prettier, with the Tailwind plugin to sort classes)
- Types: `npx tsc --noEmit`
- Tests: `npm test` (run after every change, once Vitest is installed)
- Database:
  - `npm run db:generate`: generate a migration after changing `lib/db/schema.ts`
  - `npm run db:migrate`: apply migrations
  - `npm run db:seed`: load demo data
  - A local Postgres server is already running on port 5432 for development — `DATABASE_URL` in `.env` points to it. Never use `docker-compose.yml` / `docker run` to get a database for local dev or to run tests: it's deployment-only and exposes no port to the host.

## Architecture

No `src/` folder: everything lives at the root.

- `lib/pricing/`: pricing engine as pure functions (no database access, no React import). This is the core of the project and must have 100% test coverage.
- `lib/db/`: Drizzle schema, queries and demo data (`seed.ts`)
- `lib/visitor.ts`: anonymous visitor identification (sandbox)
- `lib/actions.ts`: Server Actions
- `app/`: pages and routes
- `components/`: UI components, one file per component
- `drizzle/`: generated migrations

## Conventions

- All documentation, code, comments and commit messages are in English
- No `any`
- Every value that affects a price comes from the visitor's settings, never from a constant in the code (except demo data defaults, in `lib/db/seed.ts`)
- Rounding: only the rounding described in "Rounding" in `docs/project.md` (unit price and breakdown lines in the quote currency); everything else is rounded only for display and in the PDF
- UI and PDF text in English, formatted with `Intl` using the `en-CA` locale (`$1,234.56`)
- Mobile first: every screen is checked at 360 px before it is considered done
- No Tailwind arbitrary values (`max-w-[1200px]`, `text-[15px]`, `bg-[#fff]`): use the Tailwind scale. If no class in the scale fits, ask first, then add a named token to the `@theme` block in `app/globals.css` (e.g. `--container-page`, used as `max-w-page`). Generated shadcn/ui code in `components/ui/` is exempt

## Public repository

The repository is public and part of a portfolio: potential clients read its history.

**Commits**

- Conventional Commits: `type(scope): summary` (`feat`, `fix`, `test`, `refactor`, `docs`, `chore`), imperative summary, 72 characters max, no trailing period.
- One commit per `tasks.md` task, including its tests. The scope is the feature (`feat(pricing): add green coffee cost`).
- Every commit passes `npm test`, `npm run lint`, `npm run format:check` and `npx tsc --noEmit`.
- No "wip" commits, no chains of "fix typo" commits, no commented-out code: fix things before committing.
- Never commit or push without an explicit request.

**Security**

- No secrets in the repository: no passwords, tokens or real connection strings. Variables live in `.env` (ignored); `.env.example` documents their names with placeholder values.
- Nothing personal or internal: no real email addresses, IP addresses, hostnames or server URLs in code, docs or commit messages.
- Review `git diff --staged` before every commit.
- In the application: inputs validated with Zod on the server, prices always recalculated on the server, every query filtered by the visitor ID (a visitor never sees another visitor's data), cookie set with `httpOnly`, `secure` and `sameSite=lax`.

## Working rules

- One task at a time: read the current feature's `tasks.md`, do the next unchecked task, run the tests, then check it off
- Propose a plan before changing more than 2 files
- Write the tests before considering a task done
- Never edit an existing migration: generate a new one
- Never add anything listed under "Out of scope" in `docs/project.md`
