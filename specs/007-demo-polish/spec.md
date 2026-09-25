# 007 — Demo polish

## Goal

Meet the success criterion in `docs/project.md`: in under 2 minutes, with no explanation, on desktop and on phone, a visitor configures an order, changes a rate, sees the price change and downloads a PDF quote.

## Scope

- First visit: everything is prefilled; no empty screen.
- Review all copy against `docs/design.md`, "Interface copy".
- Accessibility: AA contrast, visible focus, 44 px touch targets, zoom never blocked.
- Check every screen at 360, 390, 768 and 1280 px, and in landscape.
- Sharing metadata (title, description, preview image) for LinkedIn links.
- Deployment: application `Dockerfile`, complete `docker-compose.yml` (application, Postgres, daily purge), migrations applied on startup.

## Acceptance criteria

- 2-minute flow completed on a real phone and on desktop.
- The deployed demo works from a shared link.

## Dependencies

001 to 006.
