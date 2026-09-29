# 010 — Quote actions (v1.1)

## Goal

Make the quote list more intuitive at first glance: delete a quote and act
on a row without opening its detail page.

## Scope

- Two quick actions on each quote row: download the PDF and delete.
- Deleting a quote is always scoped to the visitor's own data (same rule as
  every other query), and reuses the destructive-action confirmation
  pattern already used for "reset demo data" (bottom sheet, full-width
  buttons, destructive action last — `docs/design.md`).
- On mobile, swipe left on a row to reveal the two action buttons on the
  right edge, without conflicting with the tap-to-open-detail gesture on
  the rest of the row.

## Dependencies

v1 complete.
