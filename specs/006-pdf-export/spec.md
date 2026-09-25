# 006 — PDF quote export

## Goal

Produce a PDF quote in the Lantern Roasters brand, polished enough to be sent as is.

## Scope

- `@react-pdf/renderer`, route `/quotes/[number]/pdf`, `Content-Disposition: inline; filename="quote-<number>.pdf"`.
- Fonts: IBM Plex Sans and Source Serif 4 TTF files included in the project and registered with react-pdf (`next/font` does not apply to the PDF).
- Layout, colours and structure as described in `docs/design.md`, "PDF quote" section: Golden bean is only used as a rule, never as a text colour.
- Amounts read from the quote's frozen copy, never recalculated.
- "Download PDF" button on the detail page: at the top and full width on mobile.

## Acceptance criteria

- Every amount in the PDF is identical to the detail page.
- The PDF opens in the browser's viewer, on desktop and on phone.
- The file name is `quote-<number>.pdf`.

## Dependencies

005.
