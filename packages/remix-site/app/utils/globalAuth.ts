import { Temporal } from "temporal-polyfill";

// Only initialize state variables in browser environment
let globalAccessToken: string | null = null;
let tokenExpiresAt: string | null = null;

export function setGlobalAuthToken(token: string | null, expiresAt: string | null) {
  globalAccessToken = token;
  tokenExpiresAt = expiresAt;
}

export function getGlobalAuthToken() {
  return globalAccessToken;
}

export function isTokenExpired() {
  if (!tokenExpiresAt) return true;
  const expiresTime = Temporal.Instant.from(tokenExpiresAt);
  return Temporal.Now.instant().equals(expiresTime) || Temporal.Now.instant().since(expiresTime).sign >= 0;
}
