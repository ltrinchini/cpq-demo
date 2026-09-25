# 001 — Tasks

- [x] 1. Initialize the project:
  - Next.js 16, App Router, strict TypeScript, Tailwind 4, ESLint, no `src/`;
  - install `decimal.js`, `zod`, `vitest` and `@vitest/coverage-v8`;
  - add the `npm test` script;
  - set a 100% coverage threshold on `lib/pricing/`;
  - initialize shadcn/ui, mapped to the `docs/design.md` tokens in `app/globals.css`.
- [ ] 2. `lib/pricing/types.ts`: `PricingSettings`, `Configuration` and `PriceResult` types, with the fixed lists (origins, profiles, grinds, bag sizes, stations, currencies).
- [ ] 3. `lib/pricing/validation.ts`: Zod schemas with the bounds from `docs/project.md` and English error messages. Tests for every bound.
- [ ] 4. Green coffee: roasted kg, green coffee kg, cost in CAD. Tests.
- [ ] 5. Packaging: bag cost. Tests.
- [ ] 6. Labor: batches (ceiling), roasting by profile, grinding, packing. Tests, including batch edge cases.
- [ ] 7. Overhead, total cost, selling price, equivalent markup. Tests.
- [ ] 8. Conversion and rounding: unit price, total, price per kg, rounded lines, margin absorbing the difference. Tests in all four currencies and for half-up rounding.
- [ ] 9. `calculatePrice()` in `lib/pricing/index.ts`: assemble the result with `details`. Test the spec's reference example in CAD and USD.
- [ ] 10. Final check: 100% coverage, `npx tsc --noEmit` and `npm run lint` with no errors.
