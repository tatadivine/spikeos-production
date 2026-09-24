# SpikeOS Architecture

## System topology

```text
                    Microsoft 365 / Exchange
                         |             |
                    Outlook UI     Microsoft Graph
                         |             |
                  Office.js Add-in     |
                         | HTTPS       |
                         +------+------+
                                |
                                v
                         FastAPI Backend
                                |
             +------------------+------------------+
             |                  |                  |
             v                  v                  v
         Supabase          Graph adapter       AI adapter
             |
             v
   Communication Intelligence
             |
       +-----+------+
       |            |
       v            v
  Outlook Add-in  Web Dashboard
                  React/Vite
```

## Surfaces

### Outlook add-in

Personal, contextual, action-oriented.

It answers: **What should I do about this message?**

It can show:
- response/SLA state
- communication category
- lifecycle state
- commitment/next-step state
- recommended action
- employee response indicators
- explanation/evidence
- deep link to the full SpikeOS record

It must not expose manager or HR dashboards merely because a user can see the add-in.

### Web dashboard

Full analytics and workflow surface.

It answers: **How am I doing across my communications?**

It contains employee, manager, leadership and restricted administrative/compliance experiences according to server-side authorization.

## Data flow

1. User opens an Outlook message.
2. Office.js supplies message context to the add-in.
3. Add-in sends only the minimum context required to the backend.
4. Backend authenticates and authorizes the user.
5. Backend resolves the communication record and intelligence.
6. Add-in renders a compact result.
7. Actions such as commitment creation go through the backend.
8. The full record opens in SpikeOS.
9. Background ingestion can later use Microsoft Graph change notifications.

## Important architectural rules

- The browser must never be trusted to choose `my` versus `manager` access.
- Role and hierarchy decisions belong on the backend.
- AI findings are advisory and traceable to evidence.
- A negative performance record cannot be created solely by an AI classification.
- Exclusions must be explicit and testable.
- Message content should be minimized in telemetry and logs.
- Secrets belong only in backend infrastructure.
- The add-in is a separate deployable surface even though it shares visual language with SpikeOS.
