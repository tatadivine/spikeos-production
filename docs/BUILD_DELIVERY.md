# Build Delivery — End-to-End Baseline

Implemented in this package:

- Microsoft Entra JWT validation for the backend API.
- Separate Graph delegated-token validation for the Outlook Add-in.
- Supabase-backed profiles, communications, commitments, alerts, AI reviews and audit records.
- Live Outlook inbox and selected-message retrieval through Microsoft Graph.
- Response-time/SLA classification and exclusion rules.
- Sent Items correlation for response timestamps.
- Graph webhook endpoint with validation and client-state verification.
- Graph subscription creation/renewal worker.
- Optional Microsoft Entra directory synchronization for hierarchy data.
- Server-side employee/manager/leadership authorization traversal.
- Live `/bootstrap` dashboard data endpoint.
- Microsoft-authenticated SpikeOS web login.
- Live dashboard hydration without the previous demo identity switch.
- Outlook Add-in live authentication and no demo fallback.
- Production manifest preparation from environment variables.
- Updated Supabase production migration.
- Security and production configuration documentation.

Remaining deployment-time requirements are external to source code: apply database migrations, expose the Entra API scope, grant the approved Graph application permissions for organization-wide ingestion, provide a public HTTPS webhook endpoint, configure environment variables, and deploy the services.
