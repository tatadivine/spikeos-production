# Outlook Add-in Live Setup

1. Copy `.env.example` to `.env`.
2. Set the real Microsoft client ID and tenant ID.
3. Set `VITE_API_BASE_URL` to the FastAPI URL.
4. Set `VITE_SPIKEOS_URL` to the deployed SpikeOS dashboard.
5. Set `VITE_MICROSOFT_APP_ID_URI` to the Entra Application ID URI (`api://<client-id>` unless a custom URI was approved).
6. Run `npm install` and `npm run build`.
7. Use the generated `dist-manifest.xml` for Outlook deployment.

The Outlook task pane uses delegated Graph access. The Microsoft client secret is never placed in the add-in.

## Local API and Graph authentication

For local development, leave `VITE_API_BASE_URL` empty. Vite proxies `/api/*` from `https://localhost:5174` to `http://localhost:8000`, avoiding unnecessary cross-origin configuration during local Add-in testing.

The Add-in requests Microsoft Graph delegated scopes `User.Read` and `Mail.Read` through Nested App Authentication. It does not fall back to demo data. If Graph authentication cannot produce a valid token, the task pane reports the authentication/backend error instead of sending a `Bearer null` request.

The FastAPI Outlook endpoints validate the received token specifically for the Microsoft Graph audience before calling Graph.

### Production Add-in manifest

Set these environment variables before `npm run build`:

- `VITE_MICROSOFT_CLIENT_ID`
- `VITE_MICROSOFT_APP_ID_URI`
- `VITE_ADDIN_URL` — public HTTPS origin of the Add-in
- `VITE_SUPPORT_URL` — public HTTPS SpikeOS help URL

The build generates `dist-manifest.xml` with the real client ID, API resource, Add-in URLs, and support URL. The source `manifest.xml` remains a template.
