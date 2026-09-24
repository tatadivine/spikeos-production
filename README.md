# SpikeOS — End-to-End Communication Intelligence

This repository contains the SpikeOS V2 dashboard plus the production integration baseline for Microsoft 365/Outlook.

## Components

- `frontend/` — approved SpikeOS React/Vite dashboard, now authenticated with Microsoft Entra ID and hydrated from the live API.
- `outlook-addin/` — React/TypeScript Outlook task pane using Office.js and delegated Microsoft Graph access.
- `backend/` — FastAPI API, Entra token validation, Graph integration, communication intelligence, Supabase persistence, webhooks and subscription renewal.
- `supabase/` — database migrations.
- `docs/` — architecture, Microsoft setup, security and end-to-end implementation notes.

## End-to-end flow

```text
Microsoft 365 / Outlook
          |
          v
    Office.js Add-in
          |
          v
 Microsoft Entra ID
          |
          v
      FastAPI API
      /         \
     v           v
 Microsoft Graph  Supabase
      |             |
      +------> Communication Intelligence
                         |
                         v
                  SpikeOS Dashboard
```

## No production mock switch

The production path does not use the previous `DATA_SOURCE=mock` architecture. The dashboard requires Microsoft authentication and live API data. The Outlook panel requires a live delegated Graph token.

The old `src/mock/` code remains only as a compatibility module because the approved V2 components import its data-shaped functions. At application startup, those collections are replaced by the live `/bootstrap` response before the authenticated dashboard is rendered.

## Setup order

1. Apply `supabase/migrations/001_spikeos.sql`.
2. Apply `supabase/migrations/002_production_intelligence.sql`.
3. Configure `backend/.env` from `.env.example`.
4. Configure `frontend/.env` from `.env.example`.
5. Configure `outlook-addin/.env` from `.env.example`.
6. Configure the Entra API scope `access_as_user`.
7. Start FastAPI.
8. Start the SpikeOS frontend.
9. Start/build the Outlook Add-in.
10. Run directory synchronization from the administrator API endpoint.
11. Create Graph subscriptions for Inbox and Sent Items.
12. Deploy the Add-in manifest through Microsoft 365 Centralized Deployment.

## Security

Never put the Microsoft client secret or Supabase service-role key in the frontend or Outlook Add-in. See `docs/PRODUCTION_CONFIGURATION.md` and `docs/SECURITY.md`.

## Power BI Embedded

Install the frontend dependencies with `npm install`; the frontend uses the Microsoft `powerbi-client` package for the embedded report.

The Analytics page now uses a real Power BI Embedded integration. Configure the backend-only `POWERBI_*` variables documented in `docs/POWERBI_SETUP.md`. Power BI client secrets are never exposed to the Vite frontend. If credentials are missing or the Power BI API rejects the request, the Analytics page reports the configuration error instead of using mock analytics.

## Final local authentication flow

Web: Microsoft Entra login -> SpikeOS API access token -> `/api/v1/me` -> `/api/v1/bootstrap` -> protected dashboard routes.

Outlook: Office/NAA -> Microsoft Graph delegated token -> `/api/v1/outlook/inbox-summary` or `/api/v1/outlook/context` -> Microsoft Graph -> live Outlook data. The Add-in has no demo-data fallback.
