/**
 * OAuth Token Expiration Constants
 */
/** Access token expiration time in seconds (1 hour) */
export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 3600;
/** Refresh token expiration time in seconds (60 days) */
export const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 60 * 24 * 60 * 60;

/**
 * OAuth Token Types
 */
/** Standard Bearer token type as per OAuth 2.0 specification */
export const TOKEN_TYPE_BEARER = "Bearer";

/**
 * OAuth Grant Types
 */
/** Authorization code grant type for standard OAuth flow */
export const GRANT_TYPE_AUTHORIZATION_CODE = "authorization_code";
/** Refresh token grant type for obtaining new tokens without re-authorization */
export const GRANT_TYPE_REFRESH_TOKEN = "refresh_token";

/**
 * PKCE (Proof Key for Code Exchange) Methods
 */
/** SHA-256 transformation method for PKCE */
export const PKCE_METHOD_S256 = "S256";

/**
 * OAuth Error Types
 */
/** Error for malformed or missing parameters in the request */
export const ERROR_INVALID_REQUEST = "invalid_request";
/** Error for client authentication failure */
export const ERROR_INVALID_CLIENT = "invalid_client";
/** Error for invalid authorization grants or tokens */
export const ERROR_INVALID_GRANT = "invalid_grant";


export type Nullable<T> = { [P in keyof T]: T[P] | null };
export interface OIDCTokenInput {
  client_id: string;
  client_secret?: string;
  code?: string;
  grant_type: string;
  redirect_uri?: string;
  code_verifier?: string;
  refresh_token?: string;
}