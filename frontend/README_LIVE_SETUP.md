# SpikeOS Live Frontend Setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_MICROSOFT_CLIENT_ID` and `VITE_MICROSOFT_TENANT_ID`.
3. In Entra **Expose an API**, expose `access_as_user` and set the Application ID URI to `api://<client-id>`.
4. Add the SPA redirect URI for the dashboard origin, for example `http://localhost:5173`.
5. Grant the SPA permission to call the SpikeOS API scope.
6. Set `VITE_API_BASE_URL` to the FastAPI URL.
7. Start the backend first, then run `npm run dev`.

The browser never receives the Microsoft client secret or Supabase service-role key.

## Local Microsoft sign-in checklist

1. Copy `.env.example` to `.env`.
2. Set `VITE_MICROSOFT_CLIENT_ID` and `VITE_MICROSOFT_TENANT_ID`.
3. Set `VITE_MICROSOFT_APP_ID_URI` to the Entra app's Application ID URI (normally `api://<client-id>`).
4. Set `VITE_MICROSOFT_API_SCOPE` to the exposed delegated scope (normally `api://<client-id>/access_as_user`).
5. Leave `VITE_API_BASE_URL` empty for local development so Vite calls the FastAPI backend through the local `/api` proxy. The proxy target is `http://localhost:8000`.
6. In Entra ID, register `http://localhost:5173` as a SPA redirect URI for the web application.
7. Start FastAPI on port 8000 and Vite on port 5173.
8. Click **Sign in with Microsoft**. The app opens Microsoft login, obtains the SpikeOS API token, calls `/api/v1/me`, then `/api/v1/bootstrap`, and navigates to the dashboard.

The frontend no longer treats an unauthenticated browser session as a signed-in session and protected routes redirect back to the login page.
