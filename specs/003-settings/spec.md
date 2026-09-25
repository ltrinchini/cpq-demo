# 003 — Pricing settings (`/settings`)

## Goal

Let the visitor edit every value that affects the price, and go back to the demo values.

## Scope

- Categories (see `docs/design.md`, "Settings"):
  - Green coffee: price per origin, in USD/kg;
  - Roasting: loss rate and cycle time per profile, roaster capacity;
  - Packaging: cost and time per bag size;
  - Labor: hourly rates per station, grinding times;
  - Overhead and margin: overhead and margin, with the equivalent markup shown;
  - Currencies: exchange rates, in CAD per 1 unit;
  - Quotes: validity period.
- Validation with the Zod schemas in `lib/pricing/validation.ts`, on the client (message below the field) and on the server (Server Action).
- Input: percentages shown as `%`, comma converted to a period, appropriate `inputmode`.
- "Reset demo data": confirmation, then reset (002). Quotes are not touched, and the confirmation says so.
- Mobile: collapsible sections, label-and-field lists, no horizontally scrolling tables.

## Acceptance criteria

- Every `PricingSettings` value is editable except bag weight (fixed by the bag size), and nothing else.
- An out-of-bounds value is rejected with a message that says what to fix.
- A change is immediately visible in the configurator.
- The screen is checked at 360, 390, 768 and 1280 px.

## Dependencies

001, 002.
