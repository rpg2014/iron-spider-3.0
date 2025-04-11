import { OAuthError } from "iron-spider-ssdk";
import { getOIDCClientAccessor } from "src/accessors/AccessorFactory";
import { OIDCClient } from "src/accessors/OIDCClientAccessor";
import { Logger, LogLevel } from "src/util";
import { ERROR_INVALID_CLIENT, ERROR_INVALID_REQUEST, PKCE_METHOD_S256, ERROR_INVALID_GRANT, OIDCTokenInput, Nullable } from "./constants";
import crypto from "crypto";

/**
 * Validates a client exists and has the specified redirect URI
 * @param clientId The client ID to validate
 * @param redirectUri Optional redirect URI to validate
 * @param logger Logger instance for logging validation results
 * @returns The validated client
 * @throws OAuthError if validation fails
 */
export async function validateClient(clientId: string, redirectUri?: string, logger?: Logger): Promise<OIDCClient> {
  const log = logger || new Logger(LogLevel.INFO, "validateClient");

  log.info(`Validating client: ${clientId}`);
  const oidcClientAccessor = getOIDCClientAccessor();
  const client = await oidcClientAccessor.getClient(clientId);

  if (!client) {
    log.error(`Client not found: ${clientId}`);
    throw new OAuthError({
      message: "Client not found",
      error: ERROR_INVALID_CLIENT,
      error_description: "Client not found",
    });
  }

  if (redirectUri && !client.redirectUris.includes(redirectUri)) {
    log.error(`Invalid redirect URI: ${redirectUri}`);
    throw new OAuthError({
      message: "Redirect URI not found",
      error: ERROR_INVALID_REQUEST,
      error_description: "Redirect URI not found",
    });
  }

  return client;
}

/**
 * Validates required parameters in token input and returns non-null values
 * @param tokenInput The token input to validate
 * @param logger Optional logger instance for logging validation results
 * @returns Object containing validated non-null client_id and grant_type
 * @throws OAuthError if required parameters are missing
 */
export function validateTokenInput(tokenInput: Nullable<OIDCTokenInput>, logger?: Logger): {
  client_id: string;
  grant_type: string;
} {
  const log = logger || new Logger(LogLevel.INFO, "validateTokenInput");

  if (!tokenInput.client_id || !tokenInput.grant_type) {
    log.error("Missing required parameters");
    throw new OAuthError({
      message: "Missing required parameters", 
      error: ERROR_INVALID_REQUEST,
      error_description: "Missing required parameters",
    });
  }
  return {
    client_id: tokenInput.client_id,
    grant_type: tokenInput.grant_type
  };
}


/**
 * Validates PKCE (Proof Key for Code Exchange) parameters
 * @param codeChallenge The code challenge from the authorization
 * @param codeChallengeMethod The code challenge method from the authorization
 * @param codeVerifier The code verifier from the token request
 * @param logger Logger instance for logging validation results
 * @throws OAuthError if validation fails
 */
export function validatePKCE(codeChallenge: string, codeChallengeMethod: string | undefined, codeVerifier: string | null | undefined, logger?: Logger): void {
  const log = logger || new Logger(LogLevel.INFO, "validatePKCE");

  log.info("Performing PKCE verification", {
    hasChallengeMethod: !!codeChallengeMethod,
    challengeMethod: codeChallengeMethod || "plain",
  });

  if (!codeVerifier) {
    log.error("Missing code_verifier for PKCE flow");
    throw new OAuthError({
      message: "Missing code_verifier",
      error: ERROR_INVALID_REQUEST,
      error_description: "Missing code_verifier",
    });
  }

  if (codeChallengeMethod === PKCE_METHOD_S256) {
    // S256 verification
    if (codeChallenge !== convertCodeVerifier(codeVerifier)) {
      log.error("Invalid code_verifier for S256 method");
      throw new OAuthError({
        message: "Invalid code_verifier",
        error: ERROR_INVALID_GRANT,
        error_description: "Invalid code_verifier",
      });
    }
  } else if (codeChallengeMethod) {
    // Invalid method specified
    log.error(`Invalid code_challenge_method: ${codeChallengeMethod}`);
    throw new OAuthError({
      message: "Invalid code_challenge_method",
      error: ERROR_INVALID_REQUEST,
      error_description: "Invalid code_challenge_method",
    });
  } else {
    // Plain verification (no method specified)
    if (codeChallenge !== codeVerifier) {
      log.error("Invalid code_verifier for plain method");
      throw new OAuthError({
        message: "Invalid code_verifier",
        error: ERROR_INVALID_GRANT,
        error_description: "Invalid code_verifier",
      });
    }
  }
}

/**
 * Converts a code verifier to a code challenge using SHA-256 hashing
 * @param code_verifier The code verifier to convert
 * @returns The code challenge in base64url format
 */
function convertCodeVerifier(code_verifier: string): string {
  return crypto.createHash("sha256").update(code_verifier).digest("base64url");
}
