# 001 — Pricing engine

## Goal

Calculate the complete, detailed price of a configuration from the visitor's settings. Pure logic in `lib/pricing/`: no database access, no React import, 100% test coverage.

Rules reference: `docs/project.md`, sections "Pricing rules", "Rounding", "Bounds" and "Lists".

## Inputs

**`PricingSettings`** (visitor settings, all editable except bag weight, which is fixed by the bag size)

| Setting            | Key                                             | Unit                            |
| ------------------ | ----------------------------------------------- | ------------------------------- |
| Green coffee price | per origin                                      | USD/kg                          |
| Loss rate          | per profile (`light`, `medium`, `dark`)         | fraction (0.16)                 |
| Batch cycle time   | per profile                                     | min                             |
| Roaster capacity   | —                                               | green coffee kg                 |
| Grinding time      | per grind (`whole`, `espresso`, `filter`)       | min per roasted kg              |
| Packaging cost     | per bag size (`250g`, `1kg`, `5kg`)             | CAD per bag                     |
| Packing time       | per bag size                                    | min per bag                     |
| Bag weight         | per bag size                                    | roasted kg per bag (0.25, 1, 5) |
| Hourly rates       | per station (`roasting`, `grinding`, `packing`) | CAD/h                           |
| Overhead           | —                                               | fraction of direct costs        |
| Margin             | —                                               | fraction of selling price       |
| Exchange rates     | `USD`, `EUR`, `GBP`                             | CAD per 1 unit                  |

Percentages are stored as fractions (`0.35`); the interface shows them as `%`.

**`Configuration`**: `originId`, `roast`, `grind`, `bagSize`, `quantity` (number of bags), `currency` (`CAD`, `USD`, `EUR`, `GBP`).

## Calculation

1. `roasted kg = bag weight × quantity`
2. `green coffee kg = roasted kg / (1 − profile loss rate)`
3. `green coffee (CAD) = green coffee kg × USD/kg price × USD rate`
4. `packaging (CAD) = cost per bag × quantity`
5. `batches = ceil(green coffee kg / capacity)`
6. `labor (CAD)`, sum of:
   - roasting: `batches × profile cycle time / 60 × roasting rate`;
   - grinding: `roasted kg × grind time / 60 × grinding rate`;
   - packing: `quantity × time per bag / 60 × packing rate`.
7. `direct costs = green coffee + packaging + labor`
8. `overhead = direct costs × overhead rate`
9. `total cost = direct costs + overhead`
10. `selling price (CAD, exact) = total cost / (1 − margin)`
11. `equivalent markup = margin / (1 − margin)`
12. Conversion and rounding (`ROUND_HALF_UP`, 2 decimals), where `c` is the quote currency and `rate(CAD) = 1`:
    - `unit price = round(selling price / rate(c) / quantity)`;
    - `total = unit price × quantity`;
    - `price per kg = total / roasted kg` (not rounded; rounded for display);
    - `line(c) = round(CAD line / rate(c))` for green coffee, packaging, labor and overhead;
    - `margin(c) = total − sum of the four rounded lines`.

## Output

`calculatePrice(settings, configuration)` returns:

- `currency`, `unitPrice`, `total`, `pricePerKg`, `markup`;
- `lines`: the five lines (`greenCoffee`, `packaging`, `labor`, `overhead`, `margin`) in the quote currency, which add up exactly to `total`;
- `details`: intermediate values for "Show calculation details" and the PDF (roasted kg, green coffee kg, batches, minutes and cost of each labor station, unrounded CAD costs, rates used).

Every amount and quantity is a `Decimal`, never a `number`.

Invalid inputs are rejected by the Zod schemas in `validation.ts`, which enforce the bounds from `docs/project.md`. `calculatePrice` assumes validated inputs.

## Reference settings for tests

These are also the planned defaults for `seed.ts` (002).

- Ethiopia Yirgacheffe 8.40 USD/kg. Other origins (Colombia Huila 7.20, Brazil Cerrado 5.60, Guatemala Antigua 7.80, Kenya Nyeri 9.60) are not used in the example.
- Profiles:
  - light: loss 0.14, 16 min cycle;
  - medium: loss 0.16, 18 min cycle;
  - dark: loss 0.19, 21 min cycle.
- Capacity 15 kg.
- Grind: whole bean 0, espresso 3, filter 2 min/kg.
- Bag sizes:
  - 250 g: packaging 0.85 CAD, 0.5 min per bag;
  - 1 kg: packaging 1.60 CAD, 0.75 min per bag;
  - 5 kg: packaging 3.50 CAD, 1.5 min per bag.
- Hourly rates: roasting 32, grinding 26, packing 24 CAD/h.
- Overhead 0.15, margin 0.35.
- Exchange rates: USD 1.36, EUR 1.50, GBP 1.72.

## Reference example

Configuration: Ethiopia Yirgacheffe, medium roast, espresso grind, 1 kg bags, 24 bags.

| Step                | Calculation              | Result          |
| ------------------- | ------------------------ | --------------- |
| Roasted kg          | 1 × 24                   | 24              |
| Green coffee kg     | 24 / 0.84                | 28.571428…      |
| Green coffee        | 28.571428… × 8.40 × 1.36 | 326.40 CAD      |
| Packaging           | 1.60 × 24                | 38.40 CAD       |
| Batches             | ⌈28.571… / 15⌉           | 2               |
| Roasting            | 2 × 18 / 60 × 32         | 19.20 CAD       |
| Grinding            | 24 × 3 / 60 × 26         | 31.20 CAD       |
| Packing (labor)     | 24 × 0.75 / 60 × 24      | 7.20 CAD        |
| Labor               | 19.20 + 31.20 + 7.20     | 57.60 CAD       |
| Direct costs        | 326.40 + 38.40 + 57.60   | 422.40 CAD      |
| Overhead            | 422.40 × 0.15            | 63.36 CAD       |
| Total cost          |                          | 485.76 CAD      |
| Exact selling price | 485.76 / 0.65            | 747.323076… CAD |
| Equivalent markup   | 0.35 / 0.65              | 53.846…%        |

**In CAD**

- Unit price: 747.323076… / 24 = 31.138461…, rounded to **31.14**.
- Total: **747.36**.
- Price per kg: 31.14.
- Lines: green coffee 326.40, packaging 38.40, labor 57.60, overhead 63.36, margin 747.36 − 485.76 = **261.60**.

**In USD**

- Unit price: 747.323076… / 1.36 / 24 = 22.895927…, rounded to **22.90**.
- Total: **549.60**.
- Lines:
  - green coffee: 326.40 / 1.36 = 240.00;
  - packaging: 38.40 / 1.36 = 28.235…, rounded to 28.24;
  - labor: 57.60 / 1.36 = 42.352…, rounded to 42.35;
  - overhead: 63.36 / 1.36 = 46.588…, rounded to 46.59;
  - margin: 549.60 − 357.18 = **192.42** (the exact margin, 192.33, absorbs the rounding difference).

## Additional cases to cover

- Whole bean: grinding at 0.
- Green coffee kg exactly a multiple of the capacity (no extra batch) and just above it (one more batch).
- Half-up rounding on a unit price that lands exactly on `x.xx5`.
- EUR and GBP.
- Margin and overhead at 0.
- Bounds: every out-of-bounds value is rejected by Zod, with a message that says what to fix ("Margin must be less than 100%").

## Acceptance criteria

- The reference example is reproduced to the cent in CAD and in USD.
- In every currency, the lines add up to the total.
- 100% coverage on `lib/pricing/`.
- No pricing constant in `lib/pricing/`: everything comes from `PricingSettings`.
- `npx tsc --noEmit` and `npm run lint` pass with no errors.
