# SpikeOS Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Paste and run `migrations/001_spikeos.sql`.
4. In **Project Settings → API**, copy:
   - Project URL → `SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (backend only; never put this in frontend or Outlook add-in)
5. Add the values to `backend/.env`.
6. Keep Supabase Auth disabled for the first Outlook pilot if Microsoft Entra is the identity provider. The backend remains the authorization boundary.
7. For production, rotate any service-role credential if it is ever exposed and use a secret manager.
