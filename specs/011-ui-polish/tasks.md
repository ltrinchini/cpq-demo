# 011 — Tasks

- [x] 1. Configurator (desktop): replace the "Show calculation details" text
      trigger with a full-width outlined secondary button; the accordion stays
      closed on arrival.
- [x] 2. `Pricing settings`: one short explanatory sentence (`max-w-prose`,
      `text-sm text-slate`) at the top of each category panel, shown in both
      the desktop panel and the mobile accordion.
- [x] 3. Form fields on a white background: `bg-surface` (existing token)
      instead of `bg-transparent` in the shared `Input`, `Textarea` and
      `SelectTrigger`, so every field matches.
- [x] 4. `Pricing setting` inputs: the input width no longer depends on the
      unit suffix length (fixed-width unit column, so inputs and units align
      within a panel), and every category lays its fields out on the same
      grid (one column on phones, three from `sm` up), so inputs stay short
      without leaving the panel half empty. Roasting fields are grouped by
      measure (loss rates, cycle times) to fill the rows. Roaster capacity's
      unit shortened to "kg / batch" to fit the column, with "(green coffee)"
      moved to its label. Drop the accordion's paragraph margin, which pushed
      read-only values off their unit on mobile and tablet.
- [x] 5. Header tabs as segmented buttons at every width, like the
      configurator's: outlined `rounded-md` tabs spaced `gap-2`, the active one
      with a coffee green border and tint. Full width below `lg`, compact on
      the right of the header from `lg` up.
