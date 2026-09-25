# 004 — Configurator with live pricing

## Goal

The visitor configures an order and sees the price recalculate on every change, with the price breakdown as the centrepiece.

## Scope

- Options, in order: coffee, roast, grind, bag size, quantity, currency, notes. Default configuration: the 001 reference example (Ethiopia Yirgacheffe, medium, espresso, 1 kg, 24 bags, CAD).
- Client-side recalculation with `calculatePrice()` (pure function), from the visitor's settings passed by the server.
- Price summary:
  - total, unit price, price per kg;
  - breakdown bar with the roast scale, and its legend;
  - cost lines;
  - "Show calculation details", with the formula for each line.
- Recalculation effect (600 ms) and bar adjustment (200 ms), disabled when "reduce motion" is on.
- Mobile: sticky bottom bar and detail sheet (Drawer) as described in `docs/design.md`.
- "Save quote" button: opens the save dialog; saving itself is delivered in 005.

## Acceptance criteria

- Every option change updates the price without a reload.
- Displayed amounts are identical to `calculatePrice()` output.
- The displayed lines add up to the total, in every currency.
- Checked at 360 px with the longest amount (`US$123,456.78`): no horizontal scroll.

## Dependencies

001, 002, 003 (header and tokens).
