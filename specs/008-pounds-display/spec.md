# 008 — Pounds display (v1.1)

## Goal

Show quantities in pounds as well as kilograms, for customers used to imperial units.

## Scope

- Display only: calculations stay in kg.
- Conversion: 1 kg = 2.20462 lb, formatted with `Intl` in `en-CA`.
- Applies to the configurator, the calculation details, the quote detail page and the PDF.

## Acceptance criteria

- Every quantity in kg comes with its equivalent in lb.
- No price changes.

## Dependencies

v1 complete.
