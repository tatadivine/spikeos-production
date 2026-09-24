# SpikeOS End-to-End Build

This version moves the project from prototype/mock behavior toward the production architecture described by the SpikeOS implementation and rollout requirements.

## Eight implementation tracks

1. **Real authentication** — Microsoft Entra ID for the web app and Outlook Graph access; backend validates tokens and enforces authorization.
2. **Real Outlook experience** — Office.js task pane, selected-message context, live Graph message retrieval and alerts.
3. **Real backend/data pipeline** — Graph normalization, response/SLA logic, Supabase persistence and communication APIs.
4. **Persistent intelligence** — commitments, alerts, evidence, AI-assisted findings and audit events stored in Supabase.
5. **Employee/manager/leadership access** — server-side hierarchy traversal; client-side toggles cannot grant access.
6. **Dashboard integration** — the existing V2 UI hydrates from live backend data rather than the demo dataset.
7. **Graph event processing** — webhook endpoint, subscription creation and renewal worker, plus optional Entra directory sync.
8. **Security/validation/UAT** — least privilege, exclusion testing, auditability, human review controls and pilot validation.

## Required Microsoft configuration

The Entra app must expose a delegated API scope named `access_as_user` for the SpikeOS backend. The web frontend requests `api://<CLIENT_ID>/access_as_user`.

The Outlook Add-in uses delegated Microsoft Graph permissions. Organization-wide Graph ingestion requires application permissions and admin consent, including mailbox read access and directory permissions appropriate to the approved deployment.

## Required environment variables

See:
- `backend/.env.example`
- `frontend/.env.example`
- `outlook-addin/.env.example`

Never place `MICROSOFT_CLIENT_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` in browser-visible variables.

## Production flow

```text
Microsoft Entra ID
       |
       +--> SpikeOS Web --> FastAPI --> Supabase
       |
       +--> Outlook Add-in --> Graph --> FastAPI --> Supabase
                                      ^
                                      |
                              Graph webhooks
                                      |
                              subscription worker
```

## Important deployment requirement

Graph webhooks require a public HTTPS `GRAPH_WEBHOOK_URL`. Localhost can be used for the task pane, but organization-wide Graph change notifications require a publicly reachable HTTPS endpoint.
