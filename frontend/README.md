# SpikeOS — Communication Effectiveness Platform (UI/UX Prototype)

Client: **Spike Electric**
Product Owner: Nelson Bonekeh, Operating Systems Manager
Developer / System Architect: Divine Tata

This is a fully interactive **frontend prototype** of SpikeOS. There is no real backend,
database, Microsoft Graph connection, or Power BI connection — everything runs on
deterministic mock data so the demo is consistent every time it's opened. It is meant to
be demoed live to the client, not deployed as the production system.

---

## 1. Project structure

```
src/
  App.tsx, main.tsx   -> router + entry point
  pages/               -> one file per route (Dashboard, Communication, Team, Organization, Settings/*, ...)
  components/
    ui/                -> design system: Card, MetricCard, DataTable, Modal/Drawer, Toast,
                          Badge/AIBadge, TrendChart, Timeline, FilterBar/Tabs/Select, States
    layout/            -> AppShell, Sidebar, Topbar, ProductTour, HowSpikeOSWorks, nav.ts
    communication/     -> CommitmentCard, AlertCard
    performance/       -> EvidenceCard, AIInsightCard, ContextDrawer
    team/              -> EmployeeCard, ReviewCard
    customers/         -> CustomerCard
    analytics/         -> PowerBIFrame
    outlook/           -> OutlookCoachPanel
    settings/          -> SettingsTabs
  services/            -> mock service layer (mockCommunicationService, mockTeamService, ...)
  mock/                -> generator.ts (deterministic dataset), pools.ts (name/company data), seed.ts (seeded PRNG)
  lib/                 -> auth.ts (demo auth abstraction), SessionContext.tsx (role + toasts), format.ts
  types/               -> shared TypeScript interfaces (Employee, Communication, Commitment, ...)
```

## 2. Install & run

```bash
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

## 3. Build & deploy

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

`dist/` can be deployed to Vercel, Netlify, or any static host. The app uses `HashRouter`
so it also works correctly on static hosts without server-side rewrite rules.

## 4. Demo mode

There is no real authentication. The login screen's "Sign in with Microsoft" button drops
straight into the app and shows a toast confirming no real auth occurred. From inside the
app, use the **role switcher** at the bottom of the sidebar to move between:

- **Employee** (Alex Johnson) — own communication, performance, coaching, evidence
- **Manager** (Sarah Williams) — adds Team Overview, Reviews, Team Trends
- **Leadership** (Nelson Bonekeh) — adds Organization, Analytics, Reports
- **Administrator** — adds Settings, Integrations, Audit Log

Switching roles changes sidebar navigation live, simulating role-based access. This is
uses the live Microsoft Entra + FastAPI + Supabase integration described in the repository documentation — the compatibility generator is not a production data source
Microsoft Entra ID authentication that will ship in the final phase.

Use **"Start Product Tour"** (top right, any page) to walk through the full 10-step client
demonstration story automatically, switching roles and pages as it goes.

## 5. All screens / routes

| Area | Route |
|---|---|
| Login / demo entry | `/` |
| Employee dashboard | `/dashboard` |
| My Communication | `/communication` |
| Communication detail | `/communication/:id` |
| Commitments | `/commitments` |
| Follow-ups | `/followups` |
| Alert Center | `/alerts` |
| My Performance | `/performance` |
| AI Coaching | `/coaching` |
| Evidence Center | `/evidence` |
| Customers | `/customers` |
| Customer detail | `/customers/:id` |
| Team Overview (manager) | `/team` |
| Employee performance detail | `/team/:employeeId` |
| Manager Review Center | `/reviews` |
| Team Trends | `/team/trends` |
| Organization Overview (leadership) | `/organization` |
| Department Performance | `/organization/departments` |
| Organization Trends | `/organization/trends` |
| Power BI Analytics | `/analytics` |
| Reports | `/reports` |
| Outlook Communication Coach | `/outlook-coach` |
| Settings — General | `/settings` |
| Settings — Scoring | `/settings/scoring` |
| Settings — Exclusions | `/settings/exclusions` |
| Settings — Permissions | `/settings/permissions` |
| Settings — Integrations | `/settings/integrations` |
| Settings — Audit Log | `/settings/audit` |
| Help | `/help` |

## 6. Mock data

`src/mock/generator.ts` generates ~600 employees across 7 departments using a seeded PRNG
(`src/mock/seed.ts`), so headcounts, scores, and names are stable across reloads. The
"hero" demo team (Alex Johnson, Sarah Williams, Michael Brown, Daniel Carter, Emily Davis)
is hand-seeded so the client demonstration story is always the same. Around that team,
communications, commitments, follow-ups, alerts, AI findings, manager reviews, evidence
records, and audit log entries are generated deterministically.

## 7. AI transparency

Every AI-derived item carries an **"AI-assisted"** badge (`components/ui/Badge.tsx`,
`AIBadge`). Clicking it reveals *why* the item was surfaced, its confidence, and its human
review status. The Manager Review Center (`/reviews`) demonstrates that AI findings are
never automatically final — a human always confirms, dismisses, requests context, or marks
a finding incorrect. The Evidence Center (`/evidence`) and Employee Context drawer
(`components/performance/ContextDrawer.tsx`) demonstrate traceability and fairness —
every finding links back to a source record, and any finding can be challenged with context
(PTO, delegation, system issue, workload, etc.).

## 8. Replacing mock services with real APIs (future phase)

Every function in `src/services/index.ts` is a thin wrapper around `src/mock/generator.ts`,
shaped like a real API call (`forOwner(id)`, `get(id)`, `all()`). To connect a real backend:

1. Replace the bodies of the functions in `src/services/index.ts` with `fetch()` calls to
   the production SpikeOS API (which will itself call Microsoft Graph, Power BI, etc.).
2. Nothing in `src/pages` or `src/components` needs to change, since they only import from
   `src/services`, never from `src/mock` directly.
3. Remove `src/mock/*` once the real services are in place.

## 9. Where Microsoft Entra ID will be integrated

`src/lib/auth.ts` is intentionally a **demo auth abstraction** — it returns one of four
hard-coded demo sessions keyed by role, with a comment marking it for replacement. In
production:

- Replace `src/lib/auth.ts` with an MSAL (Microsoft Authentication Library) integration
  against Microsoft Entra ID.
- `SessionContext` (`src/lib/SessionContext.tsx`) should read the authenticated user's
  identity and role claims from MSAL instead of the local role switcher `useState`.
- The role switcher UI in `Sidebar.tsx` should be removed or restricted to
  administrators impersonating a view, since real role will come from Entra ID group
  membership / app roles.
- The "Sign in with Microsoft" button on `Login.tsx` should trigger `msalInstance.loginRedirect()`
  (or `loginPopup()`) instead of navigating straight to `/dashboard`.

## 10. Notes on scope

This build prioritizes the full client demonstration flow (employee -> manager review ->
leadership analytics -> Outlook Coach -> settings/governance) with every route from the
spec implemented and interactive. Given the size of the spec, some areas are intentionally
lean for a first demo pass (e.g., aggregate charts use deterministic synthetic trend lines
rather than trends literally re-derived from every one of the 600 generated employees, and
some list pages cap visible items to a representative sample rather than paginating all
600). These are straightforward to deepen in a follow-up pass once the client has given
feedback on the overall product shape.
