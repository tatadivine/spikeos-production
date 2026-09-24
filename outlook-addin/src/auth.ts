import { createNestablePublicClientApplication, type IPublicClientApplication } from "@azure/msal-browser";

declare const Office: any;

const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || "";
const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID || "";

let msalApp: IPublicClientApplication | null = null;

export async function getGraphAccessToken(): Promise<string | null> {
  if (!clientId || !tenantId) return null;

  if (!msalApp) {
    msalApp = await createNestablePublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        supportsNestedAppAuth: true,
      },
    });
  }

  try {
    const result = await msalApp.acquireTokenSilent({
      scopes: ["User.Read", "Mail.Read"],
    });
    return result.accessToken || null;
  } catch (silentError) {
    try {
      const result = await msalApp.acquireTokenPopup({
        scopes: ["User.Read", "Mail.Read"],
      });
      return result.accessToken || null;
    } catch (interactiveError) {
      console.error("SpikeOS Outlook Graph authentication failed", { silentError, interactiveError });
      return null;
    }
  }
}
