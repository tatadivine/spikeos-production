import { PublicClientApplication, type AccountInfo, type AuthenticationResult } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID as string | undefined;
const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID as string | undefined;
const apiScope = import.meta.env.VITE_MICROSOFT_API_SCOPE || `api://${clientId}/access_as_user`;

if (!clientId || !tenantId) console.warn("SpikeOS Entra environment variables are missing.");

export const msal = new PublicClientApplication({
  auth: {
    clientId: clientId || "missing-client-id",
    authority: `https://login.microsoftonline.com/${tenantId || "common"}`,
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: "sessionStorage" },
});

let initialized = false;

export async function ensureMsal() {
  if (!initialized) {
    await msal.initialize();
    initialized = true;
  }
  return msal;
}

export async function signInWithMicrosoft(): Promise<AuthenticationResult> {
  await ensureMsal();
  const account = msal.getActiveAccount() || msal.getAllAccounts()[0];
  if (account) {
    msal.setActiveAccount(account);
    return msal.acquireTokenSilent({ account, scopes: [apiScope] });
  }
  const result = await msal.loginPopup({ scopes: [apiScope], prompt: "select_account" });
  if (result.account) msal.setActiveAccount(result.account);
  return result;
}

export async function getApiToken(): Promise<string> {
  await ensureMsal();
  const account = msal.getActiveAccount() || msal.getAllAccounts()[0];
  if (!account) throw new Error("Microsoft sign-in required");
  msal.setActiveAccount(account);
  try {
    const result = await msal.acquireTokenSilent({ account, scopes: [apiScope] });
    return result.accessToken;
  } catch {
    const result = await msal.acquireTokenPopup({ account, scopes: [apiScope] });
    return result.accessToken;
  }
}

export function currentAccount(): AccountInfo | null {
  return msal.getActiveAccount() || msal.getAllAccounts()[0] || null;
}

export async function signOutMicrosoft() {
  await ensureMsal();
  await msal.logoutPopup({ account: currentAccount(), postLogoutRedirectUri: window.location.origin });
}
