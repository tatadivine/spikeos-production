# Master Prompt — SpikeOS Full-Stack + Outlook Add-in Implementation

You are a senior enterprise software architect, Microsoft 365/Graph engineer, React/TypeScript engineer, FastAPI engineer, security engineer, UX engineer and code-review lead.

You are working on the supplied SpikeOS repository. Do not throw away the existing UI. Treat the current prototype as the visual/product reference and evolve it into a clean, maintainable implementation.

## Mission

Turn the repository into an implementation-ready SpikeOS Communication Intelligence platform with three coordinated surfaces:

1. `frontend/` — SpikeOS web dashboard.
2. `outlook-addin/` — Microsoft Outlook Office Add-in built with React + TypeScript + Office.js.
3. `backend/` — FastAPI API and integration boundary for Microsoft Graph, Entra ID, intelligence, commitments, alerts, hierarchy, exclusions and audit.

Also add shared contracts and high-quality documentation.

## Existing product intent

SpikeOS helps employees improve communication effectiveness without creating a surveillance-style experience.

The system should support:
- response and acknowledgement timing
- overdue/unanswered communications
- ownership and commitments
- next steps and follow-through
- escalation
- communication quality/coaching
- positive indicators
- weekly and quarterly trends
- employee self-view
- server-authorized manager views
- restricted HR/compliance workflows
- evidence and appeals
- explicit exclusions
- auditability

Every important metric must be explainable and traceable to a source record and rule.

## Non-negotiable architecture

```text
Microsoft 365
  -> Outlook / Office.js
  -> Microsoft Graph / Entra
  -> FastAPI backend
  -> Supabase/PostgreSQL
  -> intelligence adapters
  -> React web dashboard

Outlook Add-in and Web Dashboard are separate deployable frontends.
Share design tokens/types/components where practical, but do not couple their runtime lifecycle.
```

Do not convert the Outlook add-in into a Next.js page. It is an Office Add-in task pane.

Do not pretend an Outlook task pane is a free-floating window. Implement compact/expanded content states and an `Open in SpikeOS` full experience.

## Existing UI

The supplied prototype contains a substantial dashboard and an Outlook coach concept. Preserve its visual language, routes, components and domain concepts unless a change is required for correctness.

Keep the existing dark/navy SpikeOS identity and the existing light dashboard surfaces. Do not introduce a random new design system.

## Required repository structure

```text
spikeos-platform/
├── frontend/
├── outlook-addin/
├── backend/
├── packages/
│   └── contracts/
├── docs/
├── README.md
```

## Frontend requirements

Refactor the current mock service layer behind a typed API client.

Support:
- `VITE_DATA_MODE=mock|api`
- `VITE_API_BASE_URL`
- clear loading/error/empty states
- typed API responses
- no secrets in frontend environment variables
- deep links from the add-in to a communication record
- a clear Settings > Outlook Add-in / Integrations section
- employee-facing dashboard
- manager dashboard only when backend authorization permits it

Do not trust a client-side `viewMode` switch as authorization.

If full Entra/MSAL is not yet wired, keep a clearly marked development auth adapter. Do not falsely claim that demo identity switching is production authorization.

## Backend requirements

Use FastAPI with:
- `/health`
- `/api/v1/me`
- `/api/v1/outlook/context`
- `/api/v1/communications`
- `/api/v1/communications/{id}`
- `/api/v1/commitments`
- `/api/v1/alerts`
- `/api/v1/employees/{id}`
- `/api/v1/team`
- `/api/v1/audit`
- `/api/v1/webhooks/graph` as a guarded future integration boundary

Create modules for:
- config
- auth
- Graph client
- Outlook context
- communication intelligence
- scoring/SLA rules
- commitments
- hierarchy/authorization
- exclusions
- audit
- repositories
- API schemas

Use dependency injection and typed Pydantic models.

Provide mock/dev adapters so the system runs without Microsoft credentials.

## Microsoft Graph requirements

Initial development must remain least-privilege and aligned with the already approved delegated permissions:

- `User.Read`
- `Mail.Read`
- `MailboxSettings.Read`

Do not silently add broad application permissions.

Create a Graph adapter interface so later tenant-wide ingestion can be implemented without rewriting the domain layer.

For future Graph change notifications, document:
- public HTTPS webhook
- subscription creation
- renewal
- lifecycle notifications
- mailbox scope
- permission review

## Entra requirements

Production authentication/authorization must be server-verifiable.

Model:
- employee
- team lead
- manager
- administrator
- restricted HR/compliance access

Hierarchy is server-derived.

Never accept:
- `role`
- `managerId`
- `employeeId`
- `viewMode`

from the browser as proof of authorization.

If the frontend uses MSAL, keep configuration environment-driven.

## Outlook Add-in requirements

Build a real React + TypeScript Office.js task pane.

Use:
- `Office.onReady`
- `Office.context.mailbox.item`
- current item metadata
- backend context endpoint

Create:
- `taskpane.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/office/context.ts`
- `src/api/client.ts`
- `src/auth/*`
- `src/components/*`
- `manifest.xml`

UX:
- compact state
- standard state
- current communication status
- response/SLA status
- lifecycle
- recommended action
- commitment action
- alert count
- response score
- explanation/evidence
- `Why am I seeing this?`
- `Open in SpikeOS`

The panel is personal only. Never add manager/HR dashboard toggles inside the add-in.

When no message is selected, show a useful empty state rather than crashing.

When Office.js is unavailable during ordinary browser development, use a clearly marked mock context.

## Shared contracts

Create a small package/documented contract containing:
- CommunicationContext
- Communication
- Commitment
- Alert
- EmployeeSummary
- AuthenticatedUser
- API error format

Avoid duplicating business rules in TypeScript and Python.

## Intelligence rules

Implement an explainable rule boundary.

A finding should contain:
- source communication ID
- rule ID
- evidence
- confidence
- review status
- recommended action

AI may assist with classification, but AI must not independently create a negative performance record.

Every AI-assisted negative finding requires human review before performance use.

## Exclusions

Model exclusions explicitly:
- automated messages
- newsletters/distribution lists
- FYI/no-response-needed
- approved PTO
- delegated coverage
- other approved non-actionable categories

Make exclusion decisions visible enough for employees to understand why a communication was or was not scored.

## Commitments

Persist:
- owner
- source communication
- created date
- due date
- next action
- status
- completion date
- evidence/source

The add-in should be able to create/update a commitment through the backend.

## Security

- No secrets in browser.
- No Supabase service role in browser.
- No Graph application secret in browser.
- Validate Entra tokens.
- Server-side authorization.
- Minimize message content.
- No message bodies in logs.
- Audit sensitive actions.
- Keep HR/compliance data isolated.
- Prefer certificate/managed identity for production confidential clients where supported.

## Quality requirements

Run:
- TypeScript build
- lint
- Python compile/test
- API smoke tests
- add-in build
- manifest validation if tooling is available

Fix errors rather than merely documenting them.

## Documentation requirements

Write:
- root README
- architecture
- Microsoft setup
- Outlook add-in setup/sideloading
- environment variables
- deployment
- security
- troubleshooting
- API contract
- production checklist

Documentation must distinguish:
- what works in mock mode
- what works with the development tenant
- what remains a production integration

## Do not

- Do not delete the existing prototype just because it is mock-driven.
- Do not claim Microsoft Graph is connected if it is not.
- Do not claim Entra production authentication if it is still demo auth.
- Do not put secrets in client code.
- Do not create a manager toggle as a security mechanism.
- Do not add tenant-wide Graph permissions without explicit approval.
- Do not make the add-in a manager dashboard.
- Do not make AI findings automatically become disciplinary/performance records.
- Do not over-engineer the first milestone with unnecessary microservices.

## Implementation sequence

1. Inspect the entire repository.
2. Preserve the existing dashboard.
3. Establish monorepo structure.
4. Add shared contracts.
5. Add FastAPI backend with mock adapters.
6. Add typed frontend API adapter.
7. Add Outlook Office.js add-in.
8. Connect current-message context to backend.
9. Add commitment and deep-link flows.
10. Add Entra/MSAL integration boundary.
11. Add server-side authorization/hierarchy.
12. Add Graph integration boundary.
13. Add tests and documentation.
14. Build every package and fix errors.
15. Report exactly what is implemented, what is mocked, and what credentials/admin actions remain.

## Final response format

After implementation, report:

### Implemented
Exact files/features added or changed.

### Verified
Build/test commands and results.

### Microsoft setup still required
Only the tenant/admin actions that cannot be performed from the repository.

### Known limitations
Be precise.

### Next production milestone
A short ordered list.

Do not provide vague claims such as “enterprise-ready” unless the evidence in the repository supports them.
