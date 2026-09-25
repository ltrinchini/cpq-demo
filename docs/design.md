# Design

Visual rules for the project. Every interface and every generated document (PDF) follows them. When in doubt, choose the most sober option.

Light theme only in v1: dark mode is planned for version 2 (see `docs/roadmap.md`).

## Intent

Two distinct identities:

- **The application** looks like real B2B software: calm, dense without being cluttered, trustworthy. The visitor should think "I could use this in my company", not "this is a coffee website". Coffee only shows up in the colours of the price breakdown.
- **The PDF quote** carries the brand of the fictional roastery, **Lantern Roasters**. It shows that a CPQ can produce documents in the company's own brand.

The memorable element of the demo is **the price breakdown**: a horizontal stacked bar whose segments follow the bean's progression, from green coffee to dark roast. Everything else in the interface stays quiet to let it stand out.

## Application colours

| Role                     | Name         | Hex       |
| ------------------------ | ------------ | --------- |
| Page background          | Mist         | `#F6F7F6` |
| Surfaces (panels, tables) | White       | `#FFFFFF` |
| Primary text             | Ink          | `#1C211E` |
| Secondary text           | Slate        | `#5A635D` |
| Borders and dividers     | Frost        | `#DDE2DE` |
| Actions, links, focus    | Coffee green | `#2E5A47` |
| Errors                   | Red          | `#B3261E` |

Coffee green is the only action colour: primary buttons, links, selected item, focus ring. It is never used as decoration.

### Roast scale (price breakdown only)

Used only in the breakdown bar, its legend and the swatches of the price detail. Nowhere else.

| Cost line      | Displayed label | Hex       |
| -------------- | --------------- | --------- |
| Green coffee   | Green coffee    | `#A9B98C` |
| Packaging      | Packaging       | `#D8C6A1` |
| Labor          | Labor           | `#B0875A` |
| Overhead       | Overhead        | `#7A5536` |
| Margin         | Margin          | `#3D2A1E` |

Each segment also has a label or a legend entry: colour never carries information on its own.

### Tailwind tokens

Declared once in `app/globals.css`; only these names are used afterwards (never a default Tailwind colour such as `blue-500` or `gray-200`):

```css
@theme {
  --color-mist: #f6f7f6;
  --color-surface: #ffffff;
  --color-ink: #1c211e;
  --color-slate: #5a635d;
  --color-frost: #dde2de;
  --color-action: #2e5a47;
  --color-error: #b3261e;

  --color-cost-green: #a9b98c;
  --color-cost-packaging: #d8c6a1;
  --color-cost-labor: #b0875a;
  --color-cost-overhead: #7a5536;
  --color-cost-margin: #3d2a1e;

  --font-sans: "IBM Plex Sans", system-ui, sans-serif;
  --font-serif: "Source Serif 4", Georgia, serif;
}
```

## Typography

- **Application**: IBM Plex Sans only (via `next/font/google`), weights 400, 500 and 600.
- **All amounts and quantities** use tabular figures (`tabular-nums`), so prices do not shift when they recalculate.
- Scale: 13 px (notes, captions), 15 px (body text), 18 px (section headings), 24 px (page title), 32 px (configurator total price on desktop, the only element at this size; 24 px in the mobile sticky bar).
- Inputs at 16 px on mobile: below that, iOS Safari zooms into the field on tap.
- Sentence case everywhere: no all-caps labels, no small eyebrow text above headings.
- Maximum line length: 70 characters for explanatory text.

## Formats

The interface and the PDF are in Canadian English: every format goes through `Intl` with the `en-CA` locale, never through hand-made formatting.

- Amounts: `Intl.NumberFormat('en-CA', { style: 'currency' })`, which gives `$1,234.56` in CAD, `US$1,234.56`, `€1,234.56`, `£1,234.56`.
- Quantities: `11.9 kg`, `3 batches`, `24 bags` (singular for 1: `1 bag`).
- Percentages: `16%` (no space).
- Dates: `September 25, 2026` (`dateStyle: 'long'`).
- In tables, amounts and quantities are right-aligned; text is left-aligned.

## Layout

Left-aligned content, 1200 px maximum width, 24 px margins (16 px on mobile).

### Responsive

Many visitors arrive from a shared link (LinkedIn, email) and open the demo on their phone. Mobile is not a degraded version: the 2-minute flow (configure, change a rate, see the price change, download the PDF) must work entirely by touch.

- **Mobile first**: unprefixed Tailwind classes describe mobile, prefixes widen. A single breakpoint for page structure: `lg` (1024 px). Below it, a single column; from `lg` up, the two-column layouts described below. Portrait tablets therefore get the mobile version.
- **Widths to check** for every screen: 360 px (small Android), 390 px (iPhone), 768 px (tablet), 1280 px (desktop). No horizontal page scroll at 360 px, even with the longest amounts (`US$123,456.78`).
- **No required hover**: any information shown on hover (tooltip, segment detail) is also reachable by touch.
- **Bottom-fixed elements**: heights in `dvh` (not `vh`, which the mobile address bar distorts) and `env(safe-area-inset-bottom)` padding for the iOS home bar. Page content reserves the sticky bar's height at the bottom, so the last field is never hidden.
- **Virtual keyboard**: a bottom-fixed element never covers the field being edited.
- **Numeric input**: `inputmode="decimal"` for amounts and percentages, `inputmode="numeric"` for the number of bags. The decimal separator is the period; a typed comma is converted to a period, because a phone set to French only shows the comma on that keyboard. No thousands separator in inputs.
- **Landscape orientation**: everything stays usable; the sticky bar takes no more than 25% of the screen height.

### Navigation

The header and tabs (Configure, Quotes, Pricing settings) stay visible on mobile, with no hamburger menu: three choices fit in the width. On mobile, the tabs take the full width, in equal parts, with a 44 px minimum height; the third becomes "Settings" to fit at 360 px.

### Configurator (desktop)

```
┌────────────────────────────────────────────────────────────┐
│ Lantern Roasters · CPQ   Configure  Quotes  Pricing settings│
├──────────────────────────────────┬─────────────────────────┤
│ Coffee                           │ Total price             │
│ [Ethiopia Yirgacheffe       ▾]   │ $747.36                 │
│                                  │ $31.14 / bag            │
│ Roast                            │ ▓▓▓▓▓▓░░░▒▒▒▒▒██████    │
│ ( Light ) (•Medium ) ( Dark )    │ ■ Green coffee  $326.40 │
│                                  │ ■ Packaging      $38.40 │
│ Grind / Bag size / Quantity      │ ■ Labor …               │
│ …                                │ Show calculation details│
│                                  │ [Save quote]            │
└──────────────────────────────────┴─────────────────────────┘
```

Options on the left (about 60%), price summary on the right, which stays visible while scrolling.

The currency (CAD, USD, EUR, GBP) is chosen in the options, as a dropdown (four choices, too many for segmented buttons at 360 px). Every amount in the summary is shown in that currency.

"Save quote" opens a dialog (on mobile: a bottom sheet) with a single field, "Customer name", prefilled with a fictional name and editable, and the "Save quote" button. Once saved, the "Quote saved" message offers to open the quote.

### Configurator (mobile)

```
┌────────────────────────────┐
│ Lantern Roasters · CPQ     │
│ Configure│Quotes│Settings  │
├────────────────────────────┤
│ Coffee                     │
│ [Ethiopia Yirgacheffe  ▾]  │
│ Roast                      │
│ [ Light ][•Medium][ Dark ] │
│ Grind                      │
│ [ Whole ][Espresso][Filter]│
│ Bag size / Quantity / Notes│
│ …                          │
├────────────────────────────┤
│ $747.36 ▴                  │
│ $31.14 / bag  [Save quote] │
└────────────────────────────┘
```

- Options take the full width, in one column, in this order: coffee, roast, grind, bag size, quantity, currency, notes.
- Segmented buttons take the full width, in equal parts (three choices at most, so they fit on one line at 360 px).
- Quantity: numeric field between 44 px − and + buttons.
- **Sticky bottom bar**: total price (24 px), unit price below it, and the primary "Save quote" button on the right. The bar has a shadow (it floats) and gets the same recalculation effect as the desktop summary.
- Tapping the price area opens the **detail sheet** that slides up from the bottom (shadcn/ui Drawer component): full-width breakdown bar, legend as a vertical list below the bar (never beside it), every cost line, then the calculation details. The sheet takes at most 90% of the screen height and scrolls inside.
- The sheet closes with a visible "Close" button, by swiping down, by tapping the backdrop or with the Escape key. While it is open, the page behind does not scroll and focus stays in the sheet; on close, focus returns to the bar.
- In the calculation details, each line takes two levels: label and amount on the first line, formula in 13 px below (e.g. `28.57 kg green × US$8.40 × 1.36`).

### Settings

Category navigation on the left (Green coffee, Roasting, Packaging, Labor, Overhead and margin, Currencies, Quotes), form on the right. The "Reset demo data" button sits at the bottom of the page, set apart from the rest, with a confirmation.

On mobile:

- Categories become collapsible sections; the first is open on arrival, the others closed. Several sections can be open at once.
- Editing tables (price per origin, cost per bag size, rate per station) become lists: label on the left, field on the right with the unit as a suffix (`US$/kg`, `%`, `min`). No horizontally scrolling tables.
- Error messages appear below the field concerned, full width.
- The reset confirmation opens in a bottom sheet, with full-width buttons and the destructive action last.

### Quotes

List as a table (number, customer, date, total, currency). The detail page shows a faithful preview of the PDF, with "Download PDF" as the primary action.

On mobile:

- The table becomes a list: each quote is a fully tappable row (number and total on the first line, customer and date in Slate on the second). No horizontally scrolling tables.
- On the detail page, "Download PDF" sits at the top, full width.
- The preview is not a shrunken Letter page (unreadable at 360 px): it is the same content, in the same order and with the same amounts, reflowed into one column. The exact layout is the downloaded PDF's.
- The PDF opens in the browser's viewer, with a meaningful file name (`quote-<number>.pdf`).

## Components

- Radii: 6 px for inputs and buttons, 10 px for panels and dialogs. Nothing rounder.
- Shadows: only for floating elements (menus, dialogs, mobile sheet). Panels resting on the page have a Frost border, no shadow.
- No gradients, no decorative icons, no illustrations in the application.
- One primary button (coffee green background) per screen; other actions are secondary (outlined) or links.
- Short choices (profile, grind, bag size) as segmented buttons; long lists (origins) as dropdowns.
- Always reuse a component from `components/` (or `components/ui/` for shadcn/ui) before creating a new one.

## Motion

A single effect: when the price recalculates, the amounts that changed get a brief, very light coffee green background (600 ms), and the bar segments adjust in 200 ms. Nothing else animates on load. One exception, on mobile: bottom sheets slide up and down in 200 ms. If the user has turned on "reduce motion", values change without any effect.

## Accessibility

- WCAG AA contrast at minimum for all text.
- Visible 2 px coffee green focus ring on every interactive element.
- Every field has a visible label (not just a placeholder).
- Touch targets of at least 44 px on mobile, spaced at least 8 px apart.
- Browser zoom never blocked (no `maximum-scale` or `user-scalable=no`).

## Interface copy

All displayed text (interface and PDF) is in Canadian English, in sentence case.

- Buttons use a verb that says what happens: "Save quote", "Download PDF", not "Submit" or "OK". The confirmation message reuses the same verb: "Quote saved".
- Errors say what to fix: "Margin must be less than 100%", not "Invalid value".
- An empty screen suggests the next action: "No quotes yet. Configure an order to create the first one."
- No apologies, no exclamation marks, no technical jargon.

## PDF quote — Lantern Roasters

- White background, Letter size (216 × 279 mm), 20 mm margins.
- Headings and the roastery name in Source Serif 4; text and tables in IBM Plex Sans; amounts in tabular figures.
- Colours: Roast brown `#3B2619` for headings and the rule under the header, Golden bean `#C39A5E` for a single accent (the total), text in Ink `#1C211E`.
- Golden bean is never a text colour (2.6:1 contrast on white, below the AA threshold). The total is highlighted by a 2 pt Golden bean rule above the total line; the amount itself is in Roast brown, weight 600.
- Structure: header (text logo, fictional contact details, quote number and date, expiry date); customer; order table; price breakdown; total; terms ("Prices exclude applicable taxes.", validity); footer.
- The PDF uses exactly the same amounts and rounding as the screen.
