import { createContext, useContext, useReducer, useEffect, useCallback, useRef, ReactNode } from "react";
import { toast } from "sonner";
import { ClientAuthInfo } from "~/contexts/auth";
import { setGlobalAuthInfo } from "~/utils/globalAuth";

type AuthState = ClientAuthInfo & {
  isAuthenticated: boolean;
};

type AuthAction =
  | { type: "SET_AUTH"; payload: Partial<AuthState> }
  | { type: "CLEAR_AUTH" };

type AuthContextType = AuthState & {
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, ...action.payload };

    case "CLEAR_AUTH":
      return {
        isAuthenticated: false,
        accessToken: undefined,
        expiresAt: undefined,
        id: undefined,
        idToken: undefined,
        username: undefined,
      };

    default:
      return state;
  }
}

export function AuthProvider({
  children,
  initialAuth = { isAuthenticated: false },
}: {
  children: ReactNode;
  initialAuth?: ClientAuthInfo & {
    isAuthenticated: boolean;
  };
}) {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: initialAuth.isAuthenticated,
    accessToken: initialAuth.accessToken || undefined,
    expiresAt: initialAuth.expiresAt || undefined,
    id: initialAuth.id || undefined,
    idToken: initialAuth.idToken || undefined,
    username: initialAuth.username || undefined,
  });

  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const refreshAuth = useCallback(async () => {
    const loadingToast = toast.loading("Refreshing auth state from server");
    console.log("Refreshing auth state from server");
    try {
      const response = await fetch("/api/auth/tokens");
      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: "SET_AUTH",
          payload: {
            isAuthenticated: data.isAuthenticated,
            accessToken: data.accessToken ?? undefined,
            expiresAt: data.expiresAt ?? undefined,
            id: data.id ?? undefined,
            idToken: data.idToken ?? undefined,
            username: data.username ?? undefined,
          }
        });
        toast.success("Auth state refreshed from server", {
          description: `Old expires at ${state.expiresAt}, new expires at ${data.expiresAt}`,
          duration: Infinity
        });
        return data;
      } else {
        dispatch({ type: "CLEAR_AUTH" });
        toast.error("Failed to refresh auth state from server", {
          description: "Response was received but not ok"
        });
        return { isAuthenticated: false };
      }
    } catch (error) {
      console.error("Failed to refresh auth state:", error);
      toast.error("Failed to refresh auth state from server", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      return { isAuthenticated: false };
    } finally {
      toast.dismiss(loadingToast);
    }
  }, [state.expiresAt]);

  // Update state when initialAuth changes (e.g., after navigation/revalidation)
  useEffect(() => {
    dispatch({
      type: "SET_AUTH",
      payload: initialAuth
    });
  }, [initialAuth]);

  /**
   * Auto-refresh auth state before token expiration via setTimeout
   */
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (!state.expiresAt || !state.isAuthenticated) return;

    const expiresTime = new Date(state.expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresTime - now;

    // Refresh 1 minute before expiration
    const refreshTime = Math.max(timeUntilExpiry - 60000, 0);
    timeoutIdRef.current = setTimeout(() => {
      refreshAuth();
    }, refreshTime);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [state.expiresAt, state.isAuthenticated, refreshAuth]);

  /**
   * Set global auth token for API calls + access outside of react 
   */
  useEffect(() => {
    console.log("[useAuth] Setting global auth token. Expires: ", state.expiresAt);
    setGlobalAuthInfo({
      ...state
    });
    toast.success("Global Access token set");
  }, [state.accessToken, state.expiresAt, state.id, state.idToken]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
