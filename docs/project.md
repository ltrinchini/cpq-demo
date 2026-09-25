# CPQ — Coffee roastery

A CPQ (Configure, Price, Quote) demo for a fictional coffee roastery. The visitor plays the roaster: they configure an order for a neighbourhood café (coffee, roast profile, grind, bag size, quantity), get a detailed live price and generate a quote ready to send.

## Problem

Many small manufacturers still price their quotes by hand or in a spreadsheet. It is slow, mistakes are common, and when the price of a raw material changes, nobody really knows which quotes are still profitable.

A screenshot or a description cannot show what matters in a CPQ: the pricing logic, the speed of configuration and the quality of the final quote. This project is a public demo, with fictional data, that anyone can try.

## Target user

Potential clients visiting my portfolio: SME owners, sales or operations managers whose team still prices quotes by hand or in Excel.

What they want within a few minutes:

- understand what a CPQ can do for them;
- see that the price is calculated transparently and can be adjusted;
- judge the quality of the document they would send to their own customers.

## Success criterion

In under 2 minutes, with no explanation, a visitor lands on the demo, configures an order, changes a rate, sees the price change and downloads a PDF quote. On desktop and on phone alike: many visitors open the portfolio link on their phone.

Consequence: on the first visit, everything is already filled in (realistic fictional rates, an existing sample quote, a default configuration). The visitor never starts from an empty screen.

## Principles

- **Every line of the price is visible.** Nothing is a black box: the visitor can follow the calculation from green coffee to the final price.
- **Every pricing rule is a setting.** If a number affects the price, it can be edited in `/settings`, never hard-coded.
- **No sign-up.** Each visitor has a private sandbox, identified anonymously by their browser.
- **Fictional data only.** No real supplier or customer data, exchange rates included.
- **Mobile is a real platform.** Every screen is designed for the phone, not just shrunk (rules in `docs/design.md`).
- **The quote is the product.** Its layout must be polished enough to be sent as is to a real customer.

The application: sober and professional, like real B2B software. The visitor should think "I could use this in my company", not "this is a coffee website".
The PDF quote: in the fictional roastery's brand (name, logo, warm colours). It shows the visitor that a CPQ can produce documents in their own brand, which is a selling point.

## Pricing rules

These rules are the reference for the pricing engine. Default values are fictional and can be edited by the visitor.

**Green coffee (after roast loss)**

- Coffee loses weight during roasting: `green coffee kg = roasted kg / (1 − loss rate)`.
- Loss rate per profile: light 14%, medium 16%, dark 19%.
- Green coffee price per origin, in USD per kg.

**Packaging**

- Cost per bag by bag size (bag + label + valve), in CAD.

**Labor**

- Hourly rate per station (roasting, grinding, packing), in CAD.
- Roasting: `batches = ceil(green coffee kg / roaster capacity)`. Each batch takes a cycle time (charging, roasting and cooling) that depends on the profile. Defaults: 15 kg capacity; light 16 min, medium 18 min, dark 21 min per batch.
- Grinding: time per roasted kg by grind. Defaults: whole bean 0, espresso 3 min/kg, filter 2 min/kg.
- Packing: time per bag by bag size.

**Overhead**

- Percentage applied to direct costs (green coffee + packaging + labor). Default: 15%.

**Margin**

- Margin on the selling price (not markup on cost): `selling price = total cost / (1 − margin)`. Default: 35%.
- The interface also shows the equivalent markup, to avoid any confusion.

**Currencies**

- Base currency: CAD. Green coffee is entered in USD and converted to CAD at calculation time.
- The quote can be issued in CAD, USD, EUR or GBP, chosen in the configurator: conversion happens at the end, on the selling price.
- Exchange rates are expressed in CAD per 1 foreign unit (e.g. `1 USD = 1.36 CAD`). To CAD: `× rate`; from CAD: `÷ rate`.
- Fictional exchange rates, editable in `/settings`.

**Rounding**

- Calculations use decimal precision (never floating point), with no intermediate rounding except the rounding listed here. Rounding mode: half up (`ROUND_HALF_UP`), to 2 decimals.
- Unit price (per bag): exact selling price converted to the quote currency, divided by the number of bags, then rounded.
- Total = rounded unit price × number of bags. Price per kg = total / roasted kg, rounded for display.
- Breakdown lines (green coffee, packaging, labor, overhead): converted to the quote currency, then rounded. The margin line is `total − sum of the other rounded lines`: it absorbs the difference, so the displayed lines always add up exactly to the total.

**Bounds for settings and configuration**

- Number of bags: integer from 1 to 10,000.
- Roaster capacity, batch cycle time, exchange rates: strictly greater than 0.
- Prices, costs, hourly rates, grinding and packing times: greater than or equal to 0.
- Loss rates, overhead, margin: from 0% inclusive to 100% exclusive.

**Lists**

- Origins, profiles, grinds, bag sizes, stations and currencies are fixed lists: the visitor edits their values, not their contents.

**Taxes**

- Out of scope in v1: quotes exclude taxes, with the note "Prices exclude applicable taxes.".

## Version 1 (minimum useful product)

1. **Pricing engine**: complete, detailed calculation following the rules above, in all four currencies, with unit price, price per kg and total.
2. **Per-visitor sandbox**: anonymous ID per browser. The visitor sees the demo data right away, but nothing is written to the database before their first change or first saved quote (so LinkedIn or Google preview bots create nothing). A daily job deletes sandboxes inactive for 30 days.
3. **Pricing settings** (`/settings`): edit green coffee prices, packaging costs, hourly rates, labor times, loss rates, overhead, margin, exchange rates and quote validity (30 days by default). "Reset demo data" button: restores every setting to its default, without touching quotes.
4. **Configurator**: coffee (single origin), roast profile (light, medium, dark), grind (whole bean, espresso, filter), bag size (250 g, 1 kg, 5 kg), number of bags, currency (CAD, USD, EUR, GBP), notes. Price updated live.
5. **Quotes**: save a configuration as a quote, quote list and detail page.
   - Number `Q-YYMMDD-XXXX`: current date (`America/Toronto` time zone) and a per-visitor counter that restarts at 0001 each day.
   - Date, expiry date, customer name as free text (prefilled with a fictional name to keep the flow fast).
   - A quote is frozen: it keeps a copy of the settings used and of the calculated breakdown. Changing a rate or resetting the data never changes an existing quote.
6. **PDF export** of the quote, with a polished layout.

## Version 1.1

- Quantities shown in pounds as well as kilograms.
- Blends (several origins with percentages).

## Version 2

- Dark mode.
- Customer book: a few fictional customers per sandbox, customer picked from a list when saving a quote, adding a customer (name, contact, address).

## Out of scope (v1)

- Supplier-based pricing (several suppliers for one origin, cheapest pick).
- Recurring orders and subscriptions.
- Green coffee inventory and production planning.
- User accounts, roles, teams.
- Sending the quote by email from the application, and electronic signature.
- Quote lifecycle tracking (draft, sent, accepted, declined).
- Multi-line quotes (several coffees in one quote).
- Volume discounts, promotions, sales approval rules.
- Taxes (GST, QST, HST, VAT).
- CRM or ERP integration.
- Real exchange rates.
- Dark mode (planned for version 2).
- Customer book (planned for version 2): in v1, the customer is a plain name entered on the quote.
