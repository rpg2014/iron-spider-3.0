import { createContext } from "react-router";
import type { JwtPayload } from "~/utils/utils.server";

export type AuthUser = JwtPayload & {
  accessToken: string;
  idToken: string;
  expiresAt: string;
};

export type ClientAuthInfo = Partial<{
  accessToken: string;
  expiresAt: string;
  idToken: string;
  id: string;
  username: string;
}>

export const authUserContext = createContext<AuthUser | null>(null);
export const isAuthenticatedContext = createContext<boolean>(false);
export const clientAuthContext = createContext<ClientAuthInfo | null>(null);

