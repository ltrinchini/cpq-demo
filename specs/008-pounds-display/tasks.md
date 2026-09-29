# 008 — Tasks

- [x] 1. `formatKg` (kg with its lb equivalent) in `lib/format.ts`, with
      tests. `BAG_SIZE_KG` (weight in kg per `BagSize`) next to
      `BAG_SIZE_LABELS` in `lib/labels.ts`.
- [x] 2. Green coffee quantity in the calculation details formula
      (`lib/calculation-details.ts`) uses `formatKg`.
- [x] 3. Bag size shows its lb equivalent:
  - Configurator (`options-form.tsx`): the `ToggleGroup` labels stay as
    they are (mobile width at 360 px); a small helper line below shows
    the lb equivalent of the selected size.
  - Quote detail (`quote-detail.tsx`) and PDF (`quote-document.tsx`): the
    "Bag size" value line gets the lb equivalent inline.
