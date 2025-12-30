import { Operation } from "@aws-smithy/server-common";
import { GetOAuthTokensInput, GetOAuthTokensOutput, OAuthError, InternalServerError } from "iron-spider-ssdk";
import { getOIDCClientAccessor, getAuthorizationAccessor, getTokenAccessor, getUserAccessor } from "src/accessors/AccessorFactory";
import { OIDCClient } from "src/accessors/OIDCClientAccessor";
import { HandlerContext } from "src/model/common";
import { getTokenProcessor } from "src/processors/OAuthTokenProcessor";
import { Logger, LogLevel } from "src/util";
import { Temporal } from "temporal-polyfill";
import { Nullable, OIDCTokenInput, ERROR_INVALID_CLIENT, ERROR_INVALID_REQUEST, GRANT_TYPE_REFRESH_TOKEN, GRANT_TYPE_AUTHORIZATION_CODE, ERROR_INVALID_GRANT, ACCESS_TOKEN_EXPIRES_IN_SECONDS, REFRESH_TOKEN_EXPIRES_IN_SECONDS, TOKEN_TYPE_BEARER } from "./constants";
import { validateTokenInput, validatePKCE } from "./utils";
import { v4 as uuidv4 } from "uuid";





/**
 * Handles OAuth token generation and refresh operations.
 * 
 * This operation supports two main OAuth token flows:
 * 1. Authorization Code Flow: Exchanges an authorization code for access, refresh, and ID tokens
 * 2. Refresh Token Flow: Generates new access and refresh tokens using an existing refresh token
 * 
 * @param {GetOAuthTokensInput} input - The input parameters for the token request
 * @param {HandlerContext} context - The handler context containing additional request information
 * @returns {Promise<GetOAuthTokensOutput>} A set of tokens including access, refresh, and ID tokens
 * @throws {OAuthError} Thrown for various OAuth-related validation errors
 * @throws {InternalServerError} Thrown for unexpected server-side errors during token generation
 */
export const GetOAuthTokens: Operation<GetOAuthTokensInput, GetOAuthTokensOutput, HandlerContext> = async (input: GetOAuthTokensInput, context: HandlerContext): Promise<GetOAuthTokensOutput> => {
    const logger = new Logger(LogLevel.INFO, "GetOAuthTokens");
  
    // Parse www-form-urlencoded body
    const params = new URLSearchParams(input.body);
  
    // Convert params to OIDCTokenInput
    const tokenInput: Nullable<OIDCTokenInput> = {
      client_id: params.get("client_id"),
      client_secret: params.get("client_secret"),
      code: params.get("code"),
      grant_type: params.get("grant_type"),
      redirect_uri: params.get("redirect_uri"),
      code_verifier: params.get("code_verifier"),
      refresh_token: params.get("refresh_token"),
    };
  
    logger.info(`Got token input`, {
      client_id: tokenInput.client_id,
      grant_type: tokenInput.grant_type,
      has_code: !!tokenInput.code,
      has_refresh_token: !!tokenInput.refresh_token,
    });
  
    const oidcClientAccessor = getOIDCClientAccessor();
  
    // Validate required parameters
    const { client_id, grant_type }= validateTokenInput(tokenInput, logger);
  
    if (context.oauth?.clientId && client_id !== context.oauth?.clientId) {
      logger.error(`Client ID mismatch: ${client_id} vs ${context.oauth?.clientId}`);
      throw new OAuthError({
        message: "Invalid client_id",
        error: ERROR_INVALID_CLIENT,
        error_description: "Invalid client_id",
      });
    }
  
    // Get client
    logger.info(`Getting client for client_id: ${context.oauth?.clientId ?? client_id}`);
    const client = await oidcClientAccessor.getClient(context.oauth?.clientId ?? client_id);
  
    // Client checks
    if (!client) {
      logger.error(`Client not found: ${context.oauth?.clientId ?? client_id}`);
      throw new OAuthError({
        message: "Client not found",
        error: ERROR_INVALID_CLIENT,
        error_description: "Client not found",
      });
    }
  
    if (!context.oauth?.clientId && !tokenInput.client_secret) {
      logger.error("Missing client_secret for client authentication");
      throw new OAuthError({
        message: "Missing client_secret",
        error: ERROR_INVALID_REQUEST,
        error_description: "Missing client_secret",
      });
    }
  
    if (!context.oauth?.clientId && tokenInput.client_secret && tokenInput.client_secret !== client.clientSecret) {
      logger.error("Invalid client_secret provided");
      throw new OAuthError({
        message: "Invalid client_secret",
        error: ERROR_INVALID_CLIENT,
        error_description: "Invalid client_secret",
      });
    }
  
    // Handle token flows
    if (grant_type === GRANT_TYPE_REFRESH_TOKEN) {
      logger.info("Processing refresh token flow");
      return refreshTokens(tokenInput, client);
    }
  
    if (grant_type === GRANT_TYPE_AUTHORIZATION_CODE) {
      logger.info("Processing authorization code flow");
      return generateTokens(tokenInput, client);
    } else {
      logger.error(`Invalid grant_type: ${tokenInput.grant_type}`);
      throw new OAuthError({
        message: "Invalid grant_type",
        error: ERROR_INVALID_REQUEST,
        error_description: "Invalid grant_type",
      });
    }
  };
  
  /**
 * Handles the OAuth Refresh Token flow to generate new access and refresh tokens.
 * 
 * This function validates an existing refresh token and generates new tokens
 * with the same authorization and scope as the original token.
 * 
 * @param {Nullable<OIDCTokenInput>} tokenInput - The token input containing the refresh token
 * @param {OIDCClient} client - The OAuth client associated with the token request
 * @returns {Promise<GetOAuthTokensOutput>} New access, refresh, and ID tokens
 * @throws {OAuthError} Thrown for token validation failures such as:
 *  - Missing or invalid refresh token
 *  - Expired refresh token
 *  - Invalid authorization
 */
const refreshTokens = async (tokenInput: Nullable<OIDCTokenInput>, client: OIDCClient): Promise<GetOAuthTokensOutput> => {
    const logger = new Logger(LogLevel.INFO, "refreshTokens");
    logger.info("Starting refresh token flow");
  
    const authorizationAccessor = getAuthorizationAccessor();
    const tokenAccessor = getTokenAccessor();
  
    
  
  
    if (!tokenInput?.refresh_token) {
      logger.error("No refresh token provided");
      throw new OAuthError({
        message: "Invalid refresh_token",
        error: ERROR_INVALID_GRANT,
        error_description: "Invalid refresh_token",
      });
    }
  
    logger.info("Getting token by value", tokenInput.refresh_token);
    // First get the token itself to check its expiration
    let refreshToken;
    try {
      refreshToken = await tokenAccessor.getToken(tokenInput.refresh_token);
      // need this b/c getToken throws when token isn't found. 
    }catch (error) {
      logger.error("Error getting token by value", error);
      throw new OAuthError({
        message: "Invalid refresh token - unable to get the token from ddb",
        error: ERROR_INVALID_GRANT,
        error_description: "Invalid refresh token",
      });
    }
    if (!refreshToken || !refreshToken.tokenId || refreshToken.tokenType !== "refresh") {
      logger.error("Refresh token not found or invalid");
      throw new OAuthError({
        message: "Invalid refresh token",
        error: ERROR_INVALID_GRANT,
        error_description: "Invalid refresh token",
      });
    }
  
    // Check if the token has expired
    if (Temporal.Instant.compare(Temporal.Now.instant(), refreshToken.expiresAt) > 0) {
      logger.error("Refresh token has expired");
      throw new OAuthError({
        message: "Refresh token expired",
        error: ERROR_INVALID_GRANT,
        error_description: "Refresh token expired",
      });
    }
  
    // Get the authorization for this token
    logger.info("Getting authorization for token", {
      authorizationId: refreshToken.authorizationId,
      userId: refreshToken.userId,
    });
  
    const authorization = await authorizationAccessor.getAuthorizationById(refreshToken.authorizationId, refreshToken.userId);
    if (!authorization.authorizationId || !authorization.userId || !authorization.clientId) {
      logger.error("Invalid authorization data");
      throw new OAuthError({
        message: "Invalid authorization",
        error: ERROR_INVALID_GRANT,
        error_description: "Invalid authorization",
      });
    }
  
    // validate pkce, copy code from generateTokens below.. Don't need pkce on refresh token.
    // if (tokenInput?.code_verifier) {
    //   validatePKCE(
    //     client.scopes?.includes("openid") ? "S256" : "",
    //     client.scopes?.includes("openid") ? "S256" : undefined,
    //     tokenInput.code_verifier,
    //     logger,
    //   );
    // }
    //  // PKCE verification
    //  if (tokenInput.codeChallenge) {
    //   validatePKCE(codeChallenge, codeChallengeMethod, tokenInput.code_verifier, logger);
    // }
    
    // Generate new access and refresh tokens
    logger.info("Generating new tokens");
    const tokenGenerator = getTokenProcessor();
    const accessToken = await tokenGenerator.generateAccessToken(
      authorization.authorizationId,
      authorization.clientId,
      authorization.userId,
      authorization.scopes,
    );
  
    const newRefreshToken = await tokenGenerator.generateRefreshToken(
      authorization.authorizationId,
      authorization.clientId,
      authorization.userId,
      authorization.scopes,
    );
    const sessionId= `pg.token.session.${uuidv4()}`;
    // Create token objects using the token accessor
    const newAccessTokenObj = tokenAccessor.createTokenObject(
      accessToken,
      authorization.authorizationId,
      sessionId,
      authorization.userId,
      authorization.clientId,
      "access",
      authorization.scopes,
      ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    );
  
    const newRefreshTokenObj = tokenAccessor.createTokenObject(
      newRefreshToken,
      authorization.authorizationId,
      sessionId,
      authorization.userId,
      authorization.clientId,
      "refresh",
      authorization.scopes,
      REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    );
  
    // Store the new tokens
    logger.info("Storing new tokens", {
      accessTokenId: newAccessTokenObj.tokenId,
      refreshTokenId: newRefreshTokenObj.tokenId,
    });
  
    await tokenAccessor.createToken(newAccessTokenObj);
    await tokenAccessor.createToken(newRefreshTokenObj);
    logger.info("Stored new tokens", {
      accessTokenId: newAccessTokenObj.tokenId,
      refreshTokenId: newRefreshTokenObj.tokenId,
    });
  
    // Add tokens to the authorization
    await authorizationAccessor.addTokensToAuthorization(authorization.authorizationId, authorization.userId, [newAccessTokenObj, newRefreshTokenObj]);
    // TODO remove the old tokens from the authroization
    // Need to both remove the token from the auth, but also delete the tokens from the token db.
    // need prob new methods in the authorization accessor to support this. either updating auth with new data or more specific, remove token?
    
    const deletedTokens: string[] = await authorizationAccessor.removeTokensFromAuthorizationBySessionId(authorization.authorizationId, refreshToken.sessionId, authorization.userId)
    logger.info("Deleted tokens", {
      deletedTokens: deletedTokens.map((token) => token),
    });
    // delete old tokens
    await Promise.all(deletedTokens.map(async (token) => {
      await tokenAccessor.deleteToken(token);
    }));
    logger.info("Deleted tokens from db", {
      deletedTokens: deletedTokens.map((token) => token),
    });

    // Get the user for id_token generation
    logger.info("Getting user details");
    const { displayName } = await getUserAccessor().getUser(authorization.userId);
  
    const expiresIn = ACCESS_TOKEN_EXPIRES_IN_SECONDS;
    const tokenType = TOKEN_TYPE_BEARER;
  
    logger.info("Generating ID token");
    const idToken = await tokenGenerator.generateIdToken(authorization.userId, authorization.clientId, displayName, sessionId, authorization.scopes);
  
    logger.info("Successfully completed refresh token flow");
    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: expiresIn,
      token_type: tokenType,
      scope: authorization.scopes?.join(" "),
      id_token: idToken,
    };
  };
  
  /**
 * Handles the OAuth Authorization Code flow to generate access, refresh, and ID tokens.
 * 
 * This function validates an authorization code and generates new tokens
 * for the associated user and client. It supports PKCE (Proof Key for Code Exchange)
 * for additional security.
 * 
 * @param {Nullable<OIDCTokenInput>} tokenInput - The token input containing the authorization code and redirect URI
 * @param {OIDCClient} client - The OAuth client associated with the token request
 * @returns {Promise<GetOAuthTokensOutput>} Access, refresh, and ID tokens
 * @throws {OAuthError} Thrown for various validation errors such as:
 *  - Invalid or missing authorization code
 *  - Invalid redirect URI
 *  - PKCE verification failure
 * @throws {InternalServerError} Thrown if token generation encounters unexpected errors
 */
const generateTokens = async (tokenInput: Nullable<OIDCTokenInput>, client: OIDCClient): Promise<GetOAuthTokensOutput> => {
    const logger = new Logger(LogLevel.INFO, "generateTokens");
    logger.info("Starting authorization code flow");
  
    const authorizationAccessor = getAuthorizationAccessor();
    const tokenAccessor = getTokenAccessor();
  
    // Validate required parameters
    if (!tokenInput?.code || !tokenInput?.redirect_uri) {
      logger.error("Missing required parameters", {
        hasCode: !!tokenInput?.code,
        hasRedirectUri: !!tokenInput?.redirect_uri,
      });
      throw new OAuthError({
        message: "Invalid code",
        error: ERROR_INVALID_GRANT,
        error_description: "Invalid code",
      });
    }
  
    // Validate redirect URI
    if (!client.redirectUris.includes(tokenInput.redirect_uri)) {
      logger.error(`Invalid redirect_uri: ${tokenInput.redirect_uri}`);
      throw new OAuthError({
        message: "Invalid redirect_uri",
        error: ERROR_INVALID_REQUEST,
        error_description: "Invalid redirect_uri",
      });
    }
  
    // Get authorization by code
    logger.info(`Getting authorization by code`);
    const { clientId, userId, scopes, authorizationId, codeChallenge, codeChallengeMethod } = await authorizationAccessor.getAuthorizationByCode(tokenInput.code);
  
    logger.info(`Found authorization`, { authorizationId, userId });
  
    if (!clientId || !userId || !scopes || !authorizationId) {
      logger.error("Invalid code - missing required authorization data");
      throw new OAuthError({
        message: "Invalid code",
        error: ERROR_INVALID_GRANT,
        error_description: "Invalid code",
      });
    }
  
    // PKCE verification
    if (codeChallenge) {
      validatePKCE(codeChallenge, codeChallengeMethod, tokenInput.code_verifier, logger);
    }
  
    try {
      logger.info("Generating tokens");
      const tokenProcessor = getTokenProcessor();
      const accessToken = await tokenProcessor.generateAccessToken(authorizationId, clientId, userId, scopes);
  
      const refreshToken = await tokenProcessor.generateRefreshToken(authorizationId, clientId, userId, scopes);
      const sessionId = `pg.token.session.${uuidv4()}`;
      // Create token objects using the token accessor
      const accessTokenObj = tokenAccessor.createTokenObject(accessToken, authorizationId,sessionId, userId, clientId, "access", scopes, ACCESS_TOKEN_EXPIRES_IN_SECONDS);
  
      const refreshTokenObj = tokenAccessor.createTokenObject(
        refreshToken,
        authorizationId,
        sessionId,
        userId,
        clientId,
        "refresh",
        scopes,
        REFRESH_TOKEN_EXPIRES_IN_SECONDS,
      );
  
      logger.info("Storing tokens", {
        accessTokenId: accessTokenObj.tokenId,
        refreshTokenId: refreshTokenObj.tokenId,
      });
  
      await tokenAccessor.createToken(accessTokenObj);
      await tokenAccessor.createToken(refreshTokenObj);
  
      // Mark the auth code as used
      logger.info("Marking auth code as used");
      await authorizationAccessor.setAuthCodeUsed(authorizationId, userId);
  
      // Add tokens to the authorization
      await authorizationAccessor.addTokensToAuthorization(authorizationId, userId, [accessTokenObj, refreshTokenObj]);
  
      // Get user for ID token generation
      logger.info("Getting user details for ID token");
      const { displayName } = await getUserAccessor().getUser(userId);
  
      const expiresIn = ACCESS_TOKEN_EXPIRES_IN_SECONDS;
      const tokenType = TOKEN_TYPE_BEARER;
  
      logger.info("Returning tokens");
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        token_type: tokenType,
        scope: scopes?.join(" "),
        id_token: await tokenProcessor.generateIdToken(userId, clientId, displayName, sessionId, scopes),
      };
    } catch (error: any) {
      logger.error("Error generating tokens:", error);
      throw new InternalServerError({ message: "Unable to generate tokens:" + error?.message });
    }
  };
