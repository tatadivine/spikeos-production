# Production Configuration Checklist

## Entra ID

Web dashboard:
- Single-tenant application registration.
- Expose an API scope: `access_as_user`.
- Application ID URI: `api://<CLIENT_ID>` unless a different URI is approved.
- SPA redirect URI matching the deployed dashboard origin.
- Grant the SPA permission for the SpikeOS API scope.

Outlook Add-in:
- WebApplicationInfo Id = application/client ID.
- WebApplicationInfo Resource = Application ID URI.
- Delegated Graph permissions approved for the pilot.

Organization-wide ingestion:
- Application Graph permissions must be explicitly approved and admin-consented.
- Mailbox read access is required for server-side mailbox processing.
- Directory read access is required for hierarchy synchronization.

## Secrets

Backend only:
- `MICROSOFT_CLIENT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GRAPH_CLIENT_STATE`
- `POWERBI_CLIENT_SECRET`

Never expose these as `VITE_*` variables.

## Power BI Embedded

Backend-only configuration:
- `POWERBI_TENANT_ID`
- `POWERBI_CLIENT_ID`
- `POWERBI_CLIENT_SECRET`
- `POWERBI_WORKSPACE_ID`
- `POWERBI_REPORT_ID`
- `POWERBI_DATASET_ID` when Power BI RLS is enabled
- `POWERBI_RLS_ENABLED` / `POWERBI_RLS_ROLE` as required by the Power BI semantic model

The Analytics page calls `/api/v1/analytics/powerbi/embed`. FastAPI obtains the Power BI service-principal token, retrieves the report embed URL, generates a short-lived embed token, and returns only the embed configuration to the browser. Power BI client secrets never belong in Vite environment variables.

If the report contains organization-wide data, configure Power BI RLS rather than relying only on SpikeOS page visibility. The backend can pass the signed-in user's email as the effective Power BI username when RLS is enabled.

## Graph webhook

`GRAPH_WEBHOOK_URL` must be a public HTTPS endpoint reachable by Microsoft Graph. The backend handles validation tokens, client-state verification and message ingestion. The renewal worker renews stored subscriptions.

## Pilot acceptance flow

1. Sign in to SpikeOS with Microsoft.
2. Verify `/api/v1/me` returns the Entra identity.
3. Run directory synchronization as an authorized administrator.
4. Create Inbox and Sent Items subscriptions.
5. Open Outlook and select a real email.
6. Confirm the Add-in loads the live inbox summary.
7. Confirm selecting another email updates the panel.
8. Send a response and verify the Sent Items webhook closes the communication and records response time.
9. Verify the employee dashboard uses the same persisted communication.
10. Verify a manager can see only their downstream hierarchy.
