# 005 — Quotes

## Goal

Save a configuration as a frozen quote, list quotes and show their detail.

## Scope

- **Saving**: "Save quote" dialog, with the "Customer name" field prefilled with a fictional name from `seed.ts`.
- **Server-side recalculation**: the Server Action recalculates the price with the settings stored in the database. It never trusts an amount sent by the browser.
- **Number**: `Q-YYMMDD-XXXX`.
  - The date is today's date, in the `America/Toronto` time zone.
  - `XXXX` is a per-visitor counter that restarts at 0001 each day.
  - It is assigned inside a transaction; the unique constraint prevents duplicates.
- **Frozen quote**: copy of the settings, configuration and result. `valid_until` is today plus the validity period.
- **List `/quotes`**: number, customer, date, total, currency. On mobile it becomes a list of tappable rows. The empty screen shows "No quotes yet. Configure an order to create the first one."
- **Detail `/quotes/[number]`**: preview faithful to the PDF content; the "Download PDF" button is delivered in 006.

## Acceptance criteria

- Changing a setting or resetting the data does not change an existing quote (tested).
- Two quotes saved on the same day have consecutive numbers.
- The saved total equals the total shown in the configurator.

## Dependencies

001, 002, 004.
