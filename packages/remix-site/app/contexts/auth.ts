import { createContext } from "react-router";
import type { JwtPayload } from "~/utils/utils.server";

export type AuthUser = JwtPayload & {
  accessToken: string;
  expiresAt: string;
};

export const authUserContext = createContext<AuthUser | null>(null);
export const isAuthenticatedContext = createContext<boolean>(false);
