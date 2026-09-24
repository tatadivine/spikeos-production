# SpikeOS Security Rules

1. Never expose Supabase service-role keys in frontend code.
2. Never expose Microsoft application secrets/certificates in frontend or add-in code.
3. Validate Entra access tokens on the backend.
4. Enforce employee/manager/HR authorization server-side.
5. Treat user-supplied `employeeId`, `role`, and `viewMode` as untrusted.
6. Minimize message content sent to the backend.
7. Do not log message bodies or credentials.
8. Keep AI classifications separate from confirmed performance records.
9. Require human review before negative AI findings can affect performance decisions.
10. Record audit events for sensitive access and review actions.
11. Explicitly model exclusions such as automated messages, FYI/no-response-needed, PTO and approved delegated coverage.
12. Use least privilege for Graph permissions.
13. Production confidential-client authentication should use a certificate/managed identity where supported rather than a long-lived client secret.
14. Keep Purview/compliance workflows isolated from ordinary operational analytics.
