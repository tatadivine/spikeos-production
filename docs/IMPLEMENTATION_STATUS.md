# Implementation Status

## Implemented in this repository

- Existing SpikeOS dashboard preserved under `frontend/`.
- Typed frontend API boundary.
- FastAPI backend scaffold.
- Outlook context endpoint.
- Commitment endpoint.
- Alerts endpoint.
- Development auth boundary.
- Graph adapter boundary.
- Graph webhook boundary.
- Separate React + TypeScript Office.js add-in.
- Compact/standard add-in UX.
- Deep link from add-in to SpikeOS.
- Add-in settings page in the dashboard.
- Microsoft setup/security/architecture documentation.
- Master Claude implementation prompt.

## Intentionally still development/mock

- Entra JWT validation.
- Real Microsoft Graph calls.
- Tenant-wide mailbox ingestion.
- Graph change-notification processing/renewal.
- Supabase persistence.
- Production AI provider.
- Production hierarchy resolution.
- Production HR/compliance isolation.
- Centralized Deployment.
- Production add-in authentication.

These are intentionally separated so the repository does not claim integrations that have not been configured and tested.
