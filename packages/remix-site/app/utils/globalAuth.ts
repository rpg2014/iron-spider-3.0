import { Temporal } from "temporal-polyfill";
import { ClientAuthInfo } from "~/contexts/auth";

type GlobalAuthInfo = ClientAuthInfo
// Only initialize state variables in browser environment
let globalAuthInfo: Partial<GlobalAuthInfo> | undefined;


/**
 * @deprecated
 * @returns 
 */
export function getGlobalAuthToken() {
  return globalAuthInfo?.accessToken;
}
/**
 * @deprecated
 * @returns 
 */
export function getGlobalAuthTokenExpiresAt() {
  return globalAuthInfo?.expiresAt;
}

export function getGlobalAuthInfo() {
  return globalAuthInfo;
}
export function setGlobalAuthInfo(info: Partial<GlobalAuthInfo> | undefined) {
  if (!info) {
    globalAuthInfo = undefined;
    return;
  }
  globalAuthInfo = {
    ...globalAuthInfo,
    ...info
  };
}

export function isTokenExpired() {
  if (!globalAuthInfo?.expiresAt) return true;
  const expiresTime = Temporal.Instant.from(globalAuthInfo.expiresAt);
  return Temporal.Now.instant().equals(expiresTime) || Temporal.Now.instant().since(expiresTime).sign >= 0;
}
