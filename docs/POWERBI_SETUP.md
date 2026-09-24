# SpikeOS Power BI Embedded Setup

SpikeOS now uses the **Power BI Embedded / app-owns-data** pattern for the Analytics page. The browser receives only a short-lived Power BI embed token from FastAPI; the Power BI client secret stays on the backend.

## 1. Create or choose the Power BI app registration

The Power BI service principal can use the same Microsoft Entra application as SpikeOS or a dedicated application. A dedicated application is preferable when you want the Power BI integration isolated from Graph permissions.

Configure the application with the required Power BI Service application permissions for the report and dataset, then grant admin consent. The service principal must also be allowed to use Power BI APIs in the tenant and must have access to the target workspace.

For report viewing/token generation, configure the permissions required by your embedding model, typically including `Report.Read.All` and `Dataset.Read.All` for an app-owns-data service principal. Confirm the exact permissions with the Power BI tenant/workspace configuration before production.

## 2. Get the five core values

From Microsoft Entra / Power BI:

- `POWERBI_TENANT_ID` — your Microsoft Entra tenant ID.
- `POWERBI_CLIENT_ID` — the application/client ID of the Power BI service principal.
- `POWERBI_CLIENT_SECRET` — the backend-only client secret.
- `POWERBI_WORKSPACE_ID` — the Power BI workspace ID containing the report.
- `POWERBI_REPORT_ID` — the report ID.

Optional for dynamic row-level security:

- `POWERBI_DATASET_ID` — semantic model/dataset ID used by the report.
- `POWERBI_RLS_ENABLED=true`
- `POWERBI_RLS_ROLE=` — only if your Power BI model defines a static RLS role that must be supplied in the embed token.

## 3. Backend `.env`

```env
POWERBI_TENANT_ID=YOUR_TENANT_ID
POWERBI_CLIENT_ID=YOUR_POWERBI_APP_CLIENT_ID
POWERBI_CLIENT_SECRET=YOUR_POWERBI_APP_CLIENT_SECRET
POWERBI_WORKSPACE_ID=YOUR_WORKSPACE_ID
POWERBI_REPORT_ID=YOUR_REPORT_ID
POWERBI_DATASET_ID=YOUR_DATASET_ID
POWERBI_AUTHORITY=https://login.microsoftonline.com
POWERBI_API_BASE_URL=https://api.powerbi.com/v1.0/myorg
POWERBI_EMBED_TOKEN_MINUTES=60
POWERBI_RLS_ENABLED=false
POWERBI_RLS_ROLE=
POWERBI_REQUIRE_ADMIN=true
```

Do not put any of these secrets in the Vite frontend. In particular, never create a `VITE_POWERBI_CLIENT_SECRET` variable.

## 4. How the runtime flow works

```text
Signed-in SpikeOS administrator
        |
        | GET /api/v1/analytics/powerbi/embed
        v
FastAPI
  |
  +-- Entra client credentials -> Power BI access token
  |
  +-- Get report metadata -> embedUrl
  |
  +-- Generate short-lived embed token
  |
  v
Browser receives:
  reportId + embedUrl + embedToken + expiration
        |
        v
Power BI JavaScript client embeds the report
```

The FastAPI endpoint is protected by the same SpikeOS Entra authentication and, by default, requires the effective `administrator` role. Change `POWERBI_REQUIRE_ADMIN` only if the product's approved authorization model requires broader access.

## 5. Local test

Start FastAPI:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Start the Vite frontend:

```bash
cd frontend
npm install
npm run dev
```

After Microsoft sign-in, open `/analytics`. If Power BI is not configured, SpikeOS shows the backend error rather than falling back to mock analytics.

## 6. RLS warning

The custom SpikeOS API hierarchy authorization does not automatically secure rows inside a Power BI report. If the embedded report contains organization-wide data, configure Power BI row-level security and generate the embed token with the appropriate effective identity. The current backend supports passing the signed-in user's email as the Power BI username when `POWERBI_RLS_ENABLED=true`.

The Power BI semantic model must be designed to use that identity correctly; enabling the environment flag alone does not create RLS rules.
