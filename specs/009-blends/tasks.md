# 009 — Tasks

- [x] 1. Pricing engine: `Configuration.origins` (1–3 `{ originId, percentage }`,
      percentages as fractions summing to 1, no duplicate origin), weighted
      `greenCoffeeUsdPerKg`, validation, tests. `referenceConfiguration()`
      becomes a single-origin blend (100%) so the existing suite stays
      valid unchanged; new tests cover 2–3 origins, the weighted price and
      validation errors.
- [ ] 2. Configurator: the "Coffee" field becomes an origins section — one
      origin by default (no percentage shown); "+ Add origin" reveals up to
      2 more rows, each with its own percentage field except the last one,
      whose percentage is the automatic remainder to 100%; a row can be
      removed, which recomputes the new last row's remainder.
- [ ] 3. Quote detail and PDF: the "Coffee" row shows the blend composition
      (a single origin is unchanged; a blend reads e.g. "70% Ethiopia
      Yirgacheffe, 30% Kenya Nyeri"). No migration needed: `configuration`
      and the frozen snapshots are `jsonb`.
