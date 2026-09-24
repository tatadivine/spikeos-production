import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import type { AccountType, PrivilegeLevel, Role } from "../types";
import {
  getApiToken,
  signInWithMicrosoft,
  signOutMicrosoft,
} from "./entra";
import { api } from "./api";
import { loadLiveBootstrap } from "./liveBootstrap";

interface Toast {
  id: number;
  message: string;
  tone: "default" | "success" | "error";
}

export type ViewMode = "my" | "manager";

interface Me {
  id: string;
  displayName: string;
  email: string;
  title: string;
  role: Role;
  managerId: string | null;
}

interface SessionContextValue {
  accountType: AccountType;
  employeeId: string | null;
  displayName: string;
  title: string;
  email: string;
  ready: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  switchDemoIdentity: (_identity: any) => void;
  role: Role;
  privileges: Record<string, PrivilegeLevel>;
  setPrivilege: (employeeId: string, level: PrivilegeLevel) => void;
  canUseManagerView: boolean;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  tourOpen: boolean;
  setTourOpen: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [me, setMe] = useState<Me | null>(null);

  const [privileges, setPrivileges] = useState<
    Record<string, PrivilegeLevel>
  >({});

  const [ready, setReady] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [tourOpen, setTourOpen] = useState(false);

  const [viewMode, setViewModeState] =
    useState<ViewMode>("my");

  /*
   * Restore an existing Microsoft session.
   *
   * IMPORTANT:
   * /me establishes the authenticated SpikeOS identity.
   * /bootstrap is dashboard data and must NOT determine
   * whether the user is authenticated.
   */
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        console.log(
          "[SpikeOS Auth] Checking existing Microsoft session..."
        );

        const token = await getApiToken();

        if (token) {
          console.log(
            "[SpikeOS Auth] Existing Microsoft session found."
          );

          // Establish the authenticated SpikeOS identity first.
          const next = await api<Me>("/me");

          console.log(
            "[SpikeOS Auth] Existing session /me succeeded:",
            next
          );

          if (!active) return;

          setMe(next);
          setViewModeState("my");

          // Dashboard data is secondary to authentication.
          try {
            await loadLiveBootstrap();

            console.log(
              "[SpikeOS Auth] Existing session bootstrap succeeded."
            );
          } catch (bootstrapError) {
            console.error(
              "[SpikeOS Auth] Existing session bootstrap failed:",
              bootstrapError
            );
          }
        }
      } catch (error) {
        console.debug(
          "[SpikeOS Auth] No existing Microsoft SpikeOS session:",
          error
        );
      } finally {
        if (active) {
          setReady(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const pushToast = useCallback(
    (
      message: string,
      tone: Toast["tone"] = "default"
    ) => {
      const id = Date.now() + Math.random();

      setToasts((t) => [
        ...t,
        {
          id,
          message,
          tone,
        },
      ]);

      setTimeout(() => {
        setToasts((t) =>
          t.filter((x) => x.id !== id)
        );
      }, 3400);
    },
    []
  );

  /*
   * Microsoft sign-in flow.
   *
   * IMPORTANT:
   * Authentication is established as soon as Microsoft
   * authentication + /me succeeds.
   *
   * Dashboard bootstrap happens AFTER the React session
   * has been established and therefore cannot send the
   * user back to the login page.
   */
  const signIn = useCallback(async () => {
    console.log(
      "[SpikeOS Auth] Starting Microsoft sign-in..."
    );

    // 1. Complete Microsoft authentication.
    const authResult = await signInWithMicrosoft();

    console.log(
      "[SpikeOS Auth] Microsoft authentication succeeded",
      {
        account: authResult.account?.username,
        tenantId: authResult.tenantId,
      }
    );

    // 2. Get the access token for the SpikeOS API.
    const token = await getApiToken();

    console.log(
      "[SpikeOS Auth] SpikeOS API token acquired",
      {
        tokenLength: token.length,
      }
    );

    // 3. Ask the backend who this Microsoft user is.
    const next = await api<Me>("/me");

    console.log(
      "[SpikeOS Auth] Backend /me succeeded:",
      next
    );

    /*
     * IMPORTANT:
     * Establish the authenticated React session BEFORE
     * loading dashboard data.
     */
    setMe(next);
    setViewModeState("my");

    console.log(
      "[SpikeOS Auth] React session established.",
      {
        role: next.role,
        employeeId: next.id,
      }
    );

    /*
     * 4. Dashboard/bootstrap data is secondary.
     *
     * If bootstrap fails, the user remains authenticated.
     */
    try {
      await loadLiveBootstrap();

      console.log(
        "[SpikeOS Auth] Dashboard bootstrap succeeded."
      );
    } catch (bootstrapError) {
      console.error(
        "[SpikeOS Auth] Dashboard bootstrap failed:",
        bootstrapError
      );

      // DO NOT clear me.
      // The user is still authenticated.
    }
  }, []);

  const switchDemoIdentity = useCallback(() => {
    pushToast(
      "Identity switching is disabled in production.",
      "error"
    );
  }, [pushToast]);

  /*
   * The backend /me response determines the user's role.
   */
  const role: Role = me?.role || "employee";

  const accountType: AccountType =
    role === "administrator"
      ? "administrator"
      : "employee";

  const canUseManagerView =
    role === "administrator" ||
    role === "manager" ||
    role === "team_lead";

  const setViewMode = useCallback(
    (v: ViewMode) => {
      if (
        v === "manager" &&
        !canUseManagerView
      ) {
        setViewModeState("my");
        return;
      }

      setViewModeState(v);
    },
    [canUseManagerView]
  );

  const setPrivilege = useCallback(
    (
      employeeId: string,
      level: PrivilegeLevel
    ) => {
      setPrivileges((p) => ({
        ...p,
        [employeeId]: level,
      }));
    },
    []
  );

  const signOut = useCallback(async () => {
    await signOutMicrosoft();

    setMe(null);
    setViewModeState("my");

    window.location.hash = "#/";
  }, []);

  const value = useMemo(
    () => ({
      ready,

      isAuthenticated: Boolean(me),

      accountType,

      employeeId: me?.id || null,

      displayName: me?.displayName || "",

      title: me?.title || "",

      email: me?.email || "",

      signIn,

      switchDemoIdentity,

      role,

      privileges,

      setPrivilege,

      canUseManagerView,

      viewMode,

      setViewMode,

      toasts,

      pushToast,

      tourOpen,

      setTourOpen,

      signOut,
    }),
    [
      ready,
      me,
      role,
      accountType,
      privileges,
      canUseManagerView,
      viewMode,
      toasts,
      pushToast,
      tourOpen,
      signIn,
      switchDemoIdentity,
      setPrivilege,
      setViewMode,
      signOut,
    ]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);

  if (!ctx) {
    throw new Error(
      "useSession must be used within SessionProvider"
    );
  }

  return ctx;
}

