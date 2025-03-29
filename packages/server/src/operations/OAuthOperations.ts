import { Operation } from "@aws-smithy/server-common";
import {
  ApproveOAuthInput,
  ApproveOAuthOutput,
  BadRequestError,
  GetOAuthDetailsInput,
  GetOAuthDetailsOutput,
  GetOAuthTokensInput,
  GetOAuthTokensOutput,
  GetOIDCDiscoveryOutput,
  GetOIDCDiscoveryServerInput,
  InternalServerError,
  NotFoundError,
  OAuthError,
} from "iron-spider-ssdk";
import { getAuthorizationAccessor, getOIDCClientAccessor, getUserAccessor } from "src/accessors/AccessorFactory";
import { HandlerContext } from "src/model/common";
import { Logger, LogLevel } from "src/util";
import crypto from "crypto";
import { getTokenProcessor } from "src/processors/OAuthTokenProcessor";
import { Temporal } from "temporal-polyfill";
import { OIDCClient } from "src/accessors/OIDCClientAccessor";

const secondsIn60Days = 60 * 24 * 60 * 60;
/**
 * Operations
 * 1. get client based on clientid
 * 2. verify redirect url is present in client config
 * 3. return client name
 * @param input
 * @param context
 * @returns
 */
export const GetOAuthDetails: Operation<GetOAuthDetailsInput, GetOAuthDetailsOutput, HandlerContext> = async (input, context) => {
  const logger = new Logger(LogLevel.INFO, "GetOAuthDetails");
  logger.info(`Got Input: ${JSON.stringify(input)}`);
  const oidcClientAccessor = getOIDCClientAccessor();

  const client = await oidcClientAccessor.getClient(input.clientId);
  if (!client) {
    logger.error(`Client not found: ${input.clientId}`);
    throw new NotFoundError({ message: "Client Configuration not found" });
  }
  if (input.redirectUri && !client.redirectUris.includes(input.redirectUri)) {
    logger.error(`Redirect URI not found: ${input.redirectUri}`);
    throw new NotFoundError({ message: "Redirect URI not found" });
  }

  return {
    clientName: client.clientName,
  }; //satisfies GetOAuthDetailsOutput
};

/**
 * Logic
 * 1. validate client id and redirect url
 * 2. validate scope contains openid + client has permissions to the other ones
 * check to see if user has already approved this client
 * 2.1 if user has already approved this client, update the auth with a new temp auth code.
 
 * 2.1 if code_challenge is present, save it in the authorization do i need code challenge method too?
 * 
 * 3. generate auth code
 * 4. return
 * @param input 
 * @param context 
 */
export const ApproveOAuth: Operation<ApproveOAuthInput, ApproveOAuthOutput, HandlerContext> = async (input, context) => {
  console.log("Starting ApproveOAuth operation");
  const oidcClientAccessor = getOIDCClientAccessor();
  const authorizationAccessor = getAuthorizationAccessor();
  console.log(`Getting client for client_id: ${input.client_id}`);
  const client = await oidcClientAccessor.getClient(input.client_id);
  if (!client) {
    console.log(`Client not found for client_id: ${input.client_id}`);
    throw new OAuthError({ message: "Client not found", error: "invalid_client", error_description: "Client not found" });
  }
  if (input.redirect_uri && !client.redirectUris.includes(input.redirect_uri)) {
    console.log(`Invalid redirect_uri: ${input.redirect_uri}`);
    throw new OAuthError({ message: "Redirect URI not found", error: "invalid_request", error_description: "Redirect URI not found" });
  }
  if (!context.userId || !input.client_id) {
    console.log(`User ID: ${context.userId}, Client ID: ${input.client_id}`);
    throw new OAuthError({ message: "User ID and Client ID are required", error: "invalid_request", error_description: "User ID and Client ID are required" });
  }

  console.log(`Checking for previous authorization for user: ${context.userId}`);
  let previousAuth = null;
  try {
    previousAuth = await authorizationAccessor.getAuthorizationForUserAndClient(context.userId, input.client_id);
    console.log(`Previous authorization: ${JSON.stringify(previousAuth)}`);
  } catch (error) {
    console.log(`Error getting previous authorization: ${error}`);
  }
  try {
    
    if (previousAuth && previousAuth.authorizationId) {
      
      console.log("Found previous authorization, generating new auth code for id ", previousAuth.authorizationId);
      const newAuth = await authorizationAccessor.renewAuthorization({
        previousAuthId: previousAuth.authorizationId,
        code_challenge: input.code_challenge,
        userId: previousAuth.userId,
        code_challenge_method: input.code_challenge_method,
      });
      console.log("Successfully generated new auth code");
      return {
        code: newAuth.authCode,
        redirect_uri: input.redirect_uri,
      }; //  satisfies ApproveOAuthOutput
    } else {
      console.log("Creating new authorization");
      const auth = await authorizationAccessor.createAuthorization({
        clientId: input.client_id,
        userId: context.userId,
        scopes: input.scopes ? input.scopes : [],
        code_challenge: input.code_challenge,
        code_challenge_method: input.code_challenge_method,
      });
      console.log("Successfully created new authorization");
      return {
        code: auth.authCode,
        redirect_uri: input.redirect_uri,
      }; // satisfies ApproveOAuthOutput
    }
  } catch (error: any) {
    console.log(`Error approving OAuth: ${error}`);
    throw new InternalServerError({ message: "Error approving OAuth: " + error?.message });
  }
};

type Nullable<T> = { [P in keyof T]: T[P] | null };
interface OIDCTokenInput {
  client_id: string;
  client_secret?: string;
  code?: string;
  grant_type: string;
  redirect_uri?: string;
  code_verifier?: string;
  refresh_token?: string;
}

export const GetOAuthTokens: Operation<GetOAuthTokensInput, GetOAuthTokensOutput, HandlerContext> = async (input, context) => {
  // parse www-form-urlencoded body
  const params = new URLSearchParams(input.body);
  // convert params to OIDCTokenInput
  const tokenInput: Nullable<OIDCTokenInput> = {
    client_id: params.get("client_id"),
    client_secret: params.get("client_secret"),
    code: params.get("code"),
    grant_type: params.get("grant_type"),
    redirect_uri: params.get("redirect_uri"),
    code_verifier: params.get("code_verifier"),
    refresh_token: params.get("refresh_token"),
  };
  // log tokenInput
  console.log(`Got token input: ${JSON.stringify(tokenInput)}`);
  // get authorization accessor

  const oidcClientAccessor = getOIDCClientAccessor();
  // checks
  if (!tokenInput.client_id || !tokenInput.grant_type) {
    console.log(`Missing required parameters`);
    throw new OAuthError({ message: "Missing required parameters", error: "invalid_request", error_description: "Missing required parameters" });
  }
  if(!context.oauth?.clientId && !tokenInput.client_secret) {
      throw new OAuthError({ message: "Missing client_secret", error: "invalid_request", error_description: "Missing client_secret" });
  }
  if (context.oauth?.clientId && tokenInput.client_id !== context.oauth?.clientId) {
    throw new OAuthError({ message: "Invalid client_id", error: "invalid_client", error_description: "Invalid client_id" });
  }
  const client = await oidcClientAccessor.getClient(context.oauth?.clientId ?? tokenInput.client_id);
  // client checks
  if (!client) {
    throw new OAuthError({ message: "Client not found", error: "invalid_client", error_description: "Client not found" });
  }
  if(!context.oauth?.clientId && !tokenInput.client_secret ) {
    throw new OAuthError({ message: "Missing client_secret", error: "invalid_request", error_description: "Missing client_secret" });
  }
  if(!context.oauth?.clientId && tokenInput.client_secret && tokenInput.client_secret !== client.clientSecret) {
    throw new OAuthError({ message: "Invalid client_secret", error: "invalid_client", error_description: "Invalid client_secret" });
  }

  //Handle refresh token flow
  if (tokenInput.grant_type === "refresh_token") {
    return refreshTokens(tokenInput, client);
  }
  if (tokenInput.grant_type === "authorization_code") {
    return generateTokens(tokenInput, client);
  } else {
    throw new OAuthError({ message: "Invalid grant_type", error: "invalid_request", error_description: "Invalid grant_type" });
  }
};

const refreshTokens = async (tokenInput: Nullable<OIDCTokenInput>, client: OIDCClient) => {
  console.log(`[OAuthOperations.refreshTokens] Starting refresh token flow`);
  const authorizationAccessor = getAuthorizationAccessor();
  if (!tokenInput?.refresh_token) {
    console.log(`[OAuthOperations.refreshTokens] No refresh token provided`);
    throw new OAuthError({ message: "Invalid refresh_token", error: "invalid_grant", error_description: "Invalid refresh_token" });
  }
  console.log(`[OAuthOperations.refreshTokens] Getting authorization by refresh token`);
  const { clientId, userId, scopes, authorizationId, refreshTokenInfo, refreshToken } = await authorizationAccessor.getAuthorizationByRefreshToken(tokenInput.refresh_token);
  // Generate new Access and Refresh token and set them
  if (!clientId || !userId || !authorizationId || !refreshTokenInfo || !refreshToken) {
    const missingField = !clientId ? "clientId" : !userId ? "userId" : !authorizationId ? "authorizationId" : !refreshTokenInfo ? "refreshTokenInfo" : "refreshToken";
    console.log(`[OAuthOperations.refreshTokens] Invalid or missing authorization data, missing field: ${missingField}`);
    throw new OAuthError({ message: `missing field ${missingField}` , error: "invalid_grant", error_description: "Invalid refresh_token" });
  }
  if(refreshTokenInfo.expiresAt && Temporal.Instant.compare(Temporal.Now.instant(), Temporal.Instant.from(refreshTokenInfo.expiresAt)) > 0) {
    throw new OAuthError({ message: "Refresh token expired", error: "invalid_grant", error_description: "Refresh token expired" });
  }
  console.log(`[OAuthOperations.refreshTokens] Generating new access and refresh tokens for user ${userId}`);
  const tokenProcessor = getTokenProcessor();
  const accessToken = await tokenProcessor.generateAccessToken(authorizationId, clientId, userId, scopes);
  const newRefreshToken = await tokenProcessor.generateRefreshToken(authorizationId, clientId, userId, scopes);
  console.log(`[OAuthOperations.refreshTokens] Setting new tokens in authorization`);
  await authorizationAccessor.setAccessAndRefreshToken({
    authorizationId,
    userId,
    accessToken: accessToken,
    refreshToken: newRefreshToken,
    accessTokenInfo: {
      issuedAt: Temporal.Now.instant().toString(),
      expiresAt: Temporal.Now.instant().add({ hours: 1 }).toString(),
    },
    refreshTokenInfo: {
      issuedAt: Temporal.Now.instant().toString(),
      expiresAt: Temporal.Now.instant().add({ seconds: secondsIn60Days }).toString(),
    },
  });
  console.log(`[OAuthOperations.refreshTokens] Getting user details`);
  const { displayName } = await getUserAccessor().getUser(userId);
  const expiresIn = 3600; // 1 hour
  const tokenType = "Bearer";
  console.log(`[OAuthOperations.refreshTokens] Generating ID token`);
  const idToken = await getTokenProcessor().generateIdToken(userId, clientId, displayName, scopes);
  console.log(`[OAuthOperations.refreshTokens] Successfully completed refresh token flow`);
  return {
    access_token: accessToken,
    refresh_token: newRefreshToken,
    expires_in: expiresIn,
    token_type: tokenType,
    scope: scopes?.join(" "),
    id_token: idToken,
  };
};
const generateTokens = async (tokenInput: Nullable<OIDCTokenInput>, client: OIDCClient) => {
  const authorizationAccessor = getAuthorizationAccessor();
  if (!tokenInput?.code || !tokenInput?.redirect_uri) {
    console.log(`[OAuthOperations] generateTokens: Missing required parameters`, tokenInput);
    throw new OAuthError({ message: "Invalid code", error: "invalid_grant", error_description: "Invalid code" });
  }
  if (!client.redirectUris.includes(tokenInput.redirect_uri)) {
    console.error(`[OAuthOperations] generateTokens: Invalid redirect_uri: ${tokenInput.redirect_uri}`);
    throw new OAuthError({ message: "Invalid redirect_uri", error: "invalid_request", error_description: "Invalid redirect_uri" });
  }
  console.log(`[OAuthOperations] generateTokens: getting authorization by code: ${tokenInput.code}`);
  // core logic
  const { clientId, userId, scopes, authorizationId, codeChallenge, codeChallengeMethod } = await authorizationAccessor.getAuthorizationByCode(tokenInput.code);
  console.log(`[OAuthOperations] generateTokens: found authorization: ${authorizationId}`);
  if (!clientId || !userId || !scopes || !authorizationId) {
    console.log(`Invalid code`);
    throw new OAuthError({ message: "Invalid code", error: "invalid_grant", error_description: "Invalid code" });
  }
  // check code verifier if codechallenge is present
  // check code verifier if codechallenge is present
  if (codeChallenge) {
    console.log(`[OAuthOperations] generateTokens: Doing PKCE verification`);
    if (!tokenInput.code_verifier) {
      console.log(`Missing code_verifier`);
      throw new OAuthError({ message: "Missing code_verifier", error: "invalid_request", error_description: "Missing code_verifier" });
    }

    if (codeChallengeMethod === "S256") {
      // S256 verification
      if (codeChallenge !== convertCodeVerifier(tokenInput.code_verifier)) {
        console.log(`Invalid code_verifier`);
        throw new OAuthError({ message: "Invalid code_verifier", error: "invalid_grant", error_description: "Invalid code_verifier" });
      }
    } else if (codeChallengeMethod) {
      // Invalid method specified
      console.log(`Invalid code_challenge_method: ${codeChallengeMethod}`);
      throw new OAuthError({ message: "Invalid code_challenge_method", error: "invalid_request", error_description: "Invalid code_challenge_method" });
    } else {
      // Plain verification (no method specified)
      if (codeChallenge !== tokenInput.code_verifier) {
        console.log(`Invalid code_verifier`);
        throw new OAuthError({ message: "Invalid code_verifier", error: "invalid_grant", error_description: "Invalid code_verifier" });
      }
    }
  }

  try {
    console.log(`[OAuthOperations] generateTokens: Generating tokens`);
    const tokenProcessor = getTokenProcessor();
    const accessToken = await tokenProcessor.generateAccessToken(authorizationId, clientId, userId, scopes);
    const refreshToken = tokenProcessor.generateRefreshToken(authorizationId, clientId, userId, scopes);
    console.log(`[OAuthOperations] generateTokens: Generated tokens, saving to authorization`);
    await authorizationAccessor.setAuthCodeUsed(authorizationId, userId);
    //TODO get actual times from the jwts
    await authorizationAccessor.setAccessAndRefreshToken({
      authorizationId, userId, accessToken, refreshToken,
      accessTokenInfo:{
        issuedAt: Temporal.Now.instant().toString(),
        expiresAt: Temporal.Now.instant().add({ hours: 1 }).toString(),
      },
      refreshTokenInfo: {
        issuedAt: Temporal.Now.instant().toString(),
        expiresAt: Temporal.Now.instant().add({ seconds: secondsIn60Days }).toString(),
      }
    }
    );
    const { displayName } = await getUserAccessor().getUser(userId);
    const expiresIn = 3600; // 1 hour
    const tokenType = "Bearer";
    console.log(`[OAuthOperations] generateTokens: Returning tokens`);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      token_type: tokenType,
      scope: scopes?.join(" "),
      id_token: await getTokenProcessor().generateIdToken(userId, clientId, displayName, scopes),
    };
  } catch (error: any) {
    console.error("Error generating tokens:", error);
    throw new InternalServerError({ message: "Unable to generate tokens:" + error?.message });
  }
};


function convertCodeVerifier(code_verifier: string): string {
  return crypto.createHash("sha256").update(code_verifier).digest("base64url");
}



export const GetOIDCDiscoveryOperation: Operation<GetOIDCDiscoveryServerInput, GetOIDCDiscoveryOutput, HandlerContext> = async (input, context) => {
  const authDomain = "https://auth.parkergiven.com"
  const apiDomain = 'https://api.parkergiven.com'
  return {
    issuer: authDomain,
    authorization_endpoint: `${authDomain}/authorize`,
    jwks_uri: `${apiDomain}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    token_endpoint: `${apiDomain}/v1/oauth/tokens`,
    id_token_signing_alg_values_supported: ["RS256"],
    claims_supported: ['openid', 'profile'],
    request_uri_parameter_supported: false,
    userinfo_endpoint: `${apiDomain}/v1/userInfo`
  } satisfies GetOIDCDiscoveryOutput
}