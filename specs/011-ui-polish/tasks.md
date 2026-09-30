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
- [ ] 4. `Pricing setting` inputs: the input width no longer depends on the
      unit suffix length (fixed-width unit column, so inputs and units align
      within a panel).
- [ ] 5. Header tabs on mobile and tablet (below `lg`) as a segmented control:
      bordered `rounded-md` group, active tab tinted with a coffee green
      border, like the configurator's segmented buttons. Desktop unchanged.
