import {
  createNestablePublicClientApplication,
  type IPublicClientApplication,
} from "@azure/msal-browser";

declare const Office: any;

const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || "";
const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID || "";

let msalApp: IPublicClientApplication | null = null;

function describeError(error: any) {
  if (!error) {
    return null;
  }

  return {
    name: error?.name,
    message: error?.message,
    errorCode: error?.errorCode,
    subError: error?.subError,
    errorMessage: error?.errorMessage,
    correlationId: error?.correlationId,
    stack: error?.stack,
  };
}

export async function getGraphAccessToken(): Promise<string | null> {
  if (!clientId || !tenantId) {
    console.error("SpikeOS Outlook authentication configuration is missing", {
      clientIdPresent: Boolean(clientId),
      tenantIdPresent: Boolean(tenantId),
    });

    return null;
  }

  if (!msalApp) {
    try {
      msalApp = await createNestablePublicClientApplication({
        auth: {
          clientId,
          authority: `https://login.microsoftonline.com/${tenantId}`,
          supportsNestedAppAuth: true,
        },
      });

      console.log("SpikeOS Outlook MSAL initialized successfully", {
        clientId,
        tenantId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      });
    } catch (initializationError) {
      console.error(
        "SpikeOS Outlook MSAL initialization failed",
        describeError(initializationError),
      );

      return null;
    }
  }

  try {
    console.log("SpikeOS Outlook requesting Graph token silently", {
      scopes: ["User.Read", "Mail.Read"],
    });

    const result = await msalApp.acquireTokenSilent({
      scopes: ["User.Read", "Mail.Read"],
    });

    console.log("SpikeOS Outlook Graph silent authentication succeeded", {
      account: result.account?.username,
      scopes: result.scopes,
      expiresOn: result.expiresOn,
    });

    return result.accessToken || null;
  } catch (silentError) {
    console.warn(
      "SpikeOS Outlook silent Graph authentication failed",
      describeError(silentError),
    );

    try {
      console.log("SpikeOS Outlook attempting interactive Graph authentication", {
        scopes: ["User.Read", "Mail.Read"],
      });

      const result = await msalApp.acquireTokenPopup({
        scopes: ["User.Read", "Mail.Read"],
      });

      console.log("SpikeOS Outlook Graph interactive authentication succeeded", {
        account: result.account?.username,
        scopes: result.scopes,
        expiresOn: result.expiresOn,
      });

      return result.accessToken || null;
    } catch (interactiveError) {
      console.error(
        "SpikeOS Outlook Graph authentication failed",
        {
          silentError: describeError(silentError),
          interactiveError: describeError(interactiveError),
        },
      );

      return null;
    }
  }
}

