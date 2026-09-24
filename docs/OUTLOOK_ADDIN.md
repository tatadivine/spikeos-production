# SpikeOS Outlook Add-in

## Purpose

The add-in is the employee's contextual Communication Intelligence cockpit inside Outlook.

### UX states

**Compact**
- SpikeOS identity
- alert count
- current issue
- one primary action

**Standard**
- current message context
- SLA/response state
- lifecycle
- recommended action
- commitment
- response indicators
- explanation
- `Open in SpikeOS`

**Full**
- the user follows `Open in SpikeOS` to the full web dashboard.

The add-in does not implement a fake free-floating maximize window. Outlook owns the task-pane host. A compact/expanded content control is used instead.

## Local development

```bash
cd outlook-addin
npm install
npm run dev
```

The Vite server uses HTTPS localhost. Update the URLs in `manifest.xml` if the port changes.

Sideload `manifest.xml` into the Outlook test environment.

## Office.js contract

The add-in uses:
- `Office.onReady()`
- `Office.context.mailbox.item`
- `item.itemId`
- `item.subject`
- `item.from`
- `item.dateTimeCreated`
- `item.body.getAsync(...)` only when necessary

Avoid collecting full message bodies by default. Send only the fields required to resolve the communication.

## Backend contract

`POST /api/v1/outlook/context`

Example payload:

```json
{
  "itemId": "opaque-outlook-item-id",
  "subject": "Customer request",
  "from": "customer@example.com",
  "receivedAt": "2026-09-19T10:00:00Z",
  "userPrincipalName": "alice@spikesandbox.onmicrosoft.com"
}
```

The server returns the employee-facing communication context. Production authorization must come from the authenticated Entra identity, not from a user-supplied role field.

## Deployment

Use Microsoft 365 Centralized Deployment after pilot validation. The add-in must be hosted on public HTTPS infrastructure and its manifest URLs must point to the production host.
