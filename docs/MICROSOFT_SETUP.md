# Microsoft / Entra Development Setup

## First milestone

Use the isolated Microsoft 365 development tenant and the existing Entra app registration for the initial Outlook add-in.

Delegated Microsoft Graph permissions currently expected:

- `User.Read`
- `Mail.Read`
- `MailboxSettings.Read`

Admin consent should be granted by the tenant administrator.

## Add-in application configuration

For the add-in authentication path, configure the Entra application for the authentication method selected by the implementation. Do not invent redirect URIs in code.

For a browser/MSAL implementation, configure the required SPA redirect URI for the actual HTTPS add-in host. For modern Outlook add-in authentication, review Microsoft's current Office Add-ins authentication guidance before enabling production SSO.

Keep:
- tenant ID
- client ID
- redirect URI
- API audience/scope

in environment configuration.

## What is deliberately not required yet

Do not add application-level `Mail.Read` merely because it exists.

Tenant-wide ingestion and Graph subscriptions are a later phase. They require:
- approved application permissions
- public HTTPS webhook
- subscription renewal/lifecycle handling
- mailbox scope strategy
- retention rules
- security review
- pilot validation

## Test accounts

Use Alice/Bob or equivalent test mailboxes in the isolated tenant. Verify:
1. Alice can open the add-in.
2. The add-in can identify the current user.
3. The add-in can read the current message context.
4. A backend context request returns an authorized result.
5. A commitment can be created.
6. `Open in SpikeOS` opens the matching record.

Never put passwords in source control or documentation.
