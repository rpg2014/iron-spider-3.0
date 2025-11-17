import { UserData } from "iron-spider-client";
import { createContext } from "react-router";

export const xrayContext = createContext<{traceId: string} | null>(null)

type AuthContextType = {
  isAuthenticated: boolean;
  accessToken: string | null;
  expiresAt: string | null;
  refreshAuth: () => Promise<void>;
  user: UserData
};
const authContext = createContext<AuthContextType>()