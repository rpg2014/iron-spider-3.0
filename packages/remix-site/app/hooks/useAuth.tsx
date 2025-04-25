import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLoaderData, useRevalidator } from "react-router";
import { toast } from "sonner";
import { setGlobalAuthToken } from "~/utils/globalAuth";

type AuthContextType = {
  isAuthenticated: boolean;
  accessToken: string | null;
  expiresAt: string | null;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  initialAuth = { authenticated: false },
}: {
  children: ReactNode;
  initialAuth?: {
    authenticated: boolean;
    accessToken?: string;
    expiresAt?: string;
  };
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth.authenticated);
  const [accessToken, setAccessToken] = useState(initialAuth.accessToken || null);
  const [expiresAt, setExpiresAt] = useState(initialAuth.expiresAt || null);
  const revalidator = useRevalidator();

  const refreshAuth = async () => {
    toast.loading("Refreshing auth state from server");
    console.log("Refreshing auth state from server");
    try {
      const response = await fetch("/api/auth/tokens");
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        setAccessToken(data.accessToken || null);
        setExpiresAt(data.expiresAt || null);
        toast.success("Auth state refreshed from server");
        return data;
      } else {
        setIsAuthenticated(false);
        setAccessToken(null);
        setExpiresAt(null);
        toast.error("Failed to refresh auth state from server", { description: "Response was recieved but not ok" });
        return { authenticated: false };
      }
    } catch (error) {
      console.error("Failed to refresh auth state:", error);
      toast.error("Failed to refresh auth state from server", { description: error instanceof Error ? error.message : "Unknown error" });
      return { authenticated: false };
    }
  };

  useEffect(() => {
    if (!expiresAt || !isAuthenticated) return;

    const expiresTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresTime - now;

    // Refresh 1 minute before expiration
    const refreshTime = Math.max(timeUntilExpiry - 60000, 0);
    const timerId = setTimeout(() => {
      revalidator.revalidate();
      refreshAuth();
    }, refreshTime);

    return () => clearTimeout(timerId);
  }, [expiresAt, isAuthenticated]);
  useEffect(() => {
    console.log("Setting global auth token", accessToken, expiresAt);
    setGlobalAuthToken(accessToken, expiresAt);
    toast.success("Global Access token set");
  }, [accessToken, expiresAt]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        expiresAt,
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
