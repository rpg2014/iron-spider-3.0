import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { AuthorizationAccessor, RenewAuthParams } from "../AccessorInterfaces";
import { InternalServerError, BadRequestError, OAuthError } from "iron-spider-ssdk";
import { Authorization, CreateAuthorizationInput, DDBAuthorization, DDBToken, Token } from "src/model/Auth/oauthModels";
import { Temporal } from "temporal-polyfill";
import { getTokenAccessor } from "../AccessorFactory";

export class DynamoAuthorizationAccessor extends AuthorizationAccessor {
  private TABLE_NAME: string = process.env.AUTHORIZATIONS_TABLE_NAME as string;
  private BY_AUTH_CODE_INDEX_NAME = process.env.AUTHORIZATIONS_BY_AUTH_CODE_INDEX_NAME as string;
  private BY_REFRESH_TOKEN_INDEX_NAME = process.env.AUTHORIZATIONS_BY_REFRESH_TOKEN_INDEX_NAME as string;
  private readonly client;
  private ddbdocClient;

  constructor() {
    super();
    // create dynamo db client
    this.client = new DynamoDBClient({});
    this.ddbdocClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        // This can cause issues if I accidentaly pass a real class in. Would rather fail fast here.
        // convertClassInstanceToMap: true
      },
    });
  }

  async createAuthorization({ clientId, userId, scopes, code_challenge, code_challenge_method }: CreateAuthorizationInput): Promise<Authorization> {
    const authorizationId = `pg.auth.${uuidv4()}`;
    const authorization: DDBAuthorization = {
      clientId,
      authorizationId: authorizationId,
      userId,
      scopes: scopes ? scopes : [],
      authCode: this.generateAuthCode(),
      authCodeInfo: {
        used: false,
        expiresAt: this.generateAuthCodeExpiration(),
      },
      codeChallenge: code_challenge ? code_challenge : undefined,
      codeChallengeMethod: code_challenge_method ? code_challenge_method : undefined,
      created: Temporal.Now.instant().toString(),
      lastUpdatedDate: Temporal.Now.instant().toString(),
      // initialize new token arrays
      accessTokens: [],
      refreshTokens: [],
    };

    try {
      await this.ddbdocClient.send(
        new PutCommand({
          TableName: this.TABLE_NAME,
          Item: authorization,
        }),
      );

      return await convertFromDDBAuthorization(authorization);
    } catch (error) {
      console.error("Error creating authorization:", error);
      throw new InternalServerError({ message: "Unable to create authorization" });
    }
  }

  async getAuthorizationById(authorizationId: string, userId: string): Promise<Authorization> {
    try {
      const result = await this.ddbdocClient.send(
        new GetCommand({
          TableName: this.TABLE_NAME,
          Key: {
            authorizationId,
            userId,
          },
        }),
      );

      if (!result.Item) {
        console.log("Authorization not found");
        throw new BadRequestError({ message: "Authorization not found" });
      }
      const authorization = result.Item as DDBAuthorization;

      return await convertFromDDBAuthorization(authorization);
    } catch (error) {
      console.error("Error getting authorization:", error);
      throw new InternalServerError({ message: "Unable to retrieve authorization" });
    }
  }

  // get an authorization by client id and user id using the AUTHORIZATIONS_BY_USER_INDEX_NAME index
  async getAuthorizationForUserAndClient(userId: string, clientId: string): Promise<Authorization | null> {
    try {
      const result = await this.ddbdocClient.send(
        new QueryCommand({
          TableName: this.TABLE_NAME,
          IndexName: process.env.AUTHORIZATIONS_BY_USER_INDEX_NAME,
          KeyConditionExpression: "clientId = :clientId AND userId = :userId",
          ExpressionAttributeValues: {
            ":clientId": clientId,
            ":userId": userId,
          },
        }),
      );

      if (!result.Items || result.Items.length === 0 || result.Items.length > 1) {
        console.log("Authorization not found, or more than 1 returned, length: ", result.Items?.length);
        throw new OAuthError({ message: "Authorization not found", error: "invalid_grant", error_description: "Authorization not found" });
      }
      const authorization = result.Items[0] as DDBAuthorization;

      return await convertFromDDBAuthorization(authorization);
    } catch (error) {
      console.error("Error getting authorization:", error);
      throw new InternalServerError({ message: "Unable to retrieve authorization" });
    }
  }

  async renewAuthorization({ previousAuthId, code_challenge, code_challenge_method, userId }: RenewAuthParams): Promise<Authorization> {
    console.log("[DynamoAuthorizationAccessor.renewAuthorization] Starting renewal for previousAuthId:", previousAuthId);
    const previousAuth = await this.getAuthorizationById(previousAuthId, userId);
    console.log("[DynamoAuthorizationAccessor.renewAuthorization] Retrieved previous authorization");

    // Migrate any legacy token fields if present via conversion and keep existing tokens active
    const authorization: DDBAuthorization = {
      ...convertToDDBAuthorization(previousAuth),
      authorizationId: previousAuth.authorizationId ? previousAuth.authorizationId : `pg.auth.${uuidv4()}`,
      authCode: this.generateAuthCode(),
      authCodeInfo: {
        used: false,
        expiresAt: this.generateAuthCodeExpiration(),
      },
      codeChallenge: code_challenge ? code_challenge : undefined,
      codeChallengeMethod: code_challenge_method ? code_challenge_method : undefined,
      created: previousAuth.created.toString(),
      lastUpdatedDate: Temporal.Now.instant().toString(),
    };

    // Remove legacy fields if still present
    delete authorization.accessToken;
    delete authorization.refreshToken;
    delete authorization.accessTokenInfo;
    delete authorization.refreshTokenInfo;

    console.log("[DynamoAuthorizationAccessor.renewAuthorization] Created new authorization object", authorization);

    try {
      await this.ddbdocClient.send(
        new PutCommand({
          TableName: this.TABLE_NAME,
          Item: authorization,
        }),
      );
      console.log("[DynamoAuthorizationAccessor.renewAuthorization] Successfully stored new authorization");

      return await convertFromDDBAuthorization(authorization);
    } catch (error) {
      console.error("[DynamoAuthorizationAccessor.renewAuthorization] Error creating authorization:", error);
      throw new InternalServerError({ message: "Unable to create authorization" });
    }
  }

  /**
   *
   * @param authCode
   * @returns Not a full authorization, just the auth code view (GSI )
   */
  async getAuthorizationByCode(authCode: string): Promise<Partial<Authorization>> {
    try {
      const result = await this.ddbdocClient.send(
        new QueryCommand({
          TableName: this.TABLE_NAME,
          IndexName: this.BY_AUTH_CODE_INDEX_NAME,
          KeyConditionExpression: "authCode = :authCode",
          ExpressionAttributeValues: {
            ":authCode": authCode,
          },
        }),
      );

      if (!result.Items || result.Items.length === 0 || result.Items.length > 1) {
        console.log("Authorization not found");
        throw new OAuthError({ message: "Authorization not found", error: "invalid_grant", error_description: "Authorization not found" });
      }
      const authorization = result.Items[0] as DDBAuthorization;
      console.log(
        `[DyanmoAuthorizationAccessor.getAuthorizationByCode] Authorization found, previously used: ${authorization?.authCodeInfo?.used}, expiresAt: ${authorization?.authCodeInfo?.expiresAt}.`,
      );
      // Compare is -1 if first time is before second time, 0 if equal, 1 if reverse
      if (
        authorization.authCodeInfo &&
        !authorization.authCodeInfo.used &&
        Temporal.Instant.compare(Temporal.Instant.from(authorization.authCodeInfo.expiresAt.toString()), Temporal.Now.instant()) > 0
      ) {
        if (!authorization.authorizationId) {
          // this shouldn't happen
          console.log("Authorization id not found for auth code", authCode, authorization);
          throw new InternalServerError({ message: "Authorization id not found" });
        }
        return await convertFromDDBAuthorization(authorization);
      } else {
        // if authcode is already used, then replay attack is happening and i should expire the whole key family.
        console.log(`Auth code used: ${authorization?.authCodeInfo?.used}, expiresAt: ${authorization?.authCodeInfo?.expiresAt}`);
        const authCodeExpired = Temporal.Instant.compare(
          Temporal.Instant.from(authorization?.authCodeInfo?.expiresAt.toString() ?? Temporal.Now.instant()),
          Temporal.Now.instant(),
        );
        console.log(`Auth code expired: ${authCodeExpired}`);
        throw new OAuthError({
          message: "Authorization code expired or already used",
          error: "invalid_grant",
          error_description: "Authorization code expired or already used",
        });
      }
    } catch (error) {
      console.error("Error getting authorization:", error);
      throw new InternalServerError({ message: "Unable to retrieve authorization" });
    }
  }

  // Generates a random auth code for oauth2.0 use, url base64 it
  private generateAuthCode(): string {
    return Buffer.from(uuidv4()).toString("base64url");
  }

  private generateAuthCodeExpiration = () => Temporal.Now.instant().add({ minutes: 10 }).toString();

  async setAuthCodeUsed(authorizationId: string, userId: string): Promise<void> {
    try {
      await this.ddbdocClient.send(
        new UpdateCommand({
          TableName: this.TABLE_NAME,
          Key: {
            authorizationId: authorizationId,
            userId: userId,
          },
          UpdateExpression: "set authCodeInfo.used = :used, authCodeInfo.expiresAt = :expiresAt REMOVE authCode",
          ExpressionAttributeValues: {
            ":used": true,
            ":expiresAt": Temporal.Now.instant().toString(),
          },
          ReturnValues: "ALL_NEW",
        }),
      );
      console.log("Auth code set as used");
      return;
    } catch (error: any) {
      console.error("Error setting auth code as used:", error);
      throw new InternalServerError({ message: "Unable to set auth code as used: " + error?.message });
    }
  }

  /**
   * Add a token to an authorization
   * @param authorizationId The authorization ID
   * @param userId The user ID
   * @param token The token to add
   */
  async addTokenToAuthorization(authorizationId: string, userId: string, token: Token): Promise<void> {
    try {
      if (!token.tokenId) {
        throw new BadRequestError({ message: "Token must have an ID" });
      }

      const tokenType = token.tokenType;

      // Determine which array to update based on token type
      const updateExpression =
        tokenType === "access"
          ? "set accessTokens = list_append(if_not_exists(accessTokens, :emptyList), :tokenIds), lastUpdatedDate = :lastUpdatedDate"
          : "set refreshTokens = list_append(if_not_exists(refreshTokens, :emptyList), :tokenIds), lastUpdatedDate = :lastUpdatedDate";

      await this.ddbdocClient.send(
        new UpdateCommand({
          TableName: this.TABLE_NAME,
          Key: {
            authorizationId,
            userId,
          },
          UpdateExpression: updateExpression,
          ExpressionAttributeValues: {
            ":emptyList": [],
            ":tokenIds": [token.tokenId],
            ":lastUpdatedDate": Temporal.Now.instant().toString(),
          },
          ReturnValues: "ALL_NEW",
        }),
      );

      console.log(`Token ${token.tokenId} added to authorization ${authorizationId}`);
      return;
    } catch (error) {
      console.error("Error adding token to authorization:", error);
      throw new InternalServerError({ message: "Unable to add token to authorization" });
    }
  }

  /**
   * Add multiple tokens to an authorization
   * @param authorizationId The authorization ID
   * @param userId The user ID
   * @param tokens The tokens to add
   */
  async addTokensToAuthorization(authorizationId: string, userId: string, tokens: Token[]): Promise<void> {
    try {
      // Separate tokens by type
      const accessTokenIds: string[] = [];
      const refreshTokenIds: string[] = [];

      for (const token of tokens) {
        if (!token.tokenId) {
          console.warn("Token without ID found, skipping");
          continue;
        }

        if (token.tokenType === "access") {
          accessTokenIds.push(token.tokenId);
        } else if (token.tokenType === "refresh") {
          refreshTokenIds.push(token.tokenId);
        } else {
          console.warn(`Unknown token type: ${token.tokenType}, skipping`);
        }
      }

      // Update the authorization with the token IDs
      if (accessTokenIds.length > 0 || refreshTokenIds.length > 0) {
        let updateExpression = "set lastUpdatedDate = :lastUpdatedDate";
        const expressionAttributeValues: Record<string, any> = {
          ":lastUpdatedDate": Temporal.Now.instant().toString(),
          ":emptyList": [],
        };

        if (accessTokenIds.length > 0) {
          updateExpression += ", accessTokens = list_append(if_not_exists(accessTokens, :emptyList), :accessTokenIds)";
          expressionAttributeValues[":accessTokenIds"] = accessTokenIds;
        }

        if (refreshTokenIds.length > 0) {
          updateExpression += ", refreshTokens = list_append(if_not_exists(refreshTokens, :emptyList), :refreshTokenIds)";
          expressionAttributeValues[":refreshTokenIds"] = refreshTokenIds;
        }

        await this.ddbdocClient.send(
          new UpdateCommand({
            TableName: this.TABLE_NAME,
            Key: {
              authorizationId,
              userId,
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW",
          }),
        );

        console.log(`Added ${accessTokenIds.length} access tokens and ${refreshTokenIds.length} refresh tokens to authorization ${authorizationId}`);
      }

      return;
    } catch (error) {
      console.error("Error adding tokens to authorization:", error);
      throw new InternalServerError({ message: "Unable to add tokens to authorization" });
    }
  }
  async removeTokensFromAuthorizationBySessionId(authorizationId: string, sessionId: string, userId: string) {
    // get all tokens from authorization then filter by sessionId
    console.log(`[DynamoAuthorizationAccessor.removeTokensFromAuthorizationBySessionId] Removing tokens from authorization ${authorizationId} for session ${sessionId}`);
    const tokens = await getTokenAccessor().getTokensByAuthorizationId(authorizationId);
    const filteredTokens = tokens.filter(token => token.sessionId === sessionId);
    console.log(`[DynamoAuthorizationAccessor.removeTokensFromAuthorizationBySessionId] Found ${filteredTokens.length} tokens to remove`);

    // remove tokens from authorization object
    const authorization = await this.getAuthorizationById(authorizationId, userId);
    if (!authorization) {
      throw new InternalServerError({ message: "Authorization not found" });
    }
    console.log(`[DynamoAuthorizationAccessor.removeTokensFromAuthorizationBySessionId] Authorization found, removing tokens`);
    const updatedTokens = authorization.accessTokens?.filter(token => !filteredTokens.find(filteredToken => filteredToken.tokenId === token.tokenId)) ?? [];
    const updatedRefreshTokens = authorization.refreshTokens?.filter(token => !filteredTokens.find(filteredToken => filteredToken.tokenId === token.tokenId)) ?? [];
    console.log(`[DynamoAuthorizationAccessor.removeTokensFromAuthorizationBySessionId] Updated tokens: ${updatedTokens.length}, Updated refresh tokens: ${updatedRefreshTokens.length}`);
    authorization.accessTokens = updatedTokens;
    authorization.refreshTokens = updatedRefreshTokens;

    // update dynamo db item
    console.log(`[DynamoAuthorizationAccessor.removeTokensFromAuthorizationBySessionId] Updating authorization in dynamo db`);
    try {
      const ddbAuth = convertToDDBAuthorization({
        ...authorization,
        accessTokens: updatedTokens,
        refreshTokens: updatedRefreshTokens,
        lastUpdatedDate: Temporal.Now.instant()
      });

      await this.ddbdocClient.send(
        new UpdateCommand({
          TableName: this.TABLE_NAME,
          Key: {
            authorizationId,
            userId,
          },
          UpdateExpression: "set accessTokens = :accessTokens, refreshTokens = :refreshTokens, lastUpdatedDate = :lastUpdatedDate",
          ExpressionAttributeValues: {
            ":accessTokens": ddbAuth.accessTokens,
            ":refreshTokens": ddbAuth.refreshTokens,
            ":lastUpdatedDate": ddbAuth.lastUpdatedDate
          },
          ReturnValues: "ALL_NEW",
        }),
      );
      console.log("[DynamoAuthorizationAccessor.removeTokensFromAuthorizationBySessionId] Successfully updated authorization");
      return filteredTokens.map(token => token.tokenId)
    } catch (error) {
      console.error("[DynamoAuthorizationAccessor.removeTokensFromAuthorizationBySessionId] Error updating authorization:", error);
      throw new InternalServerError({ message: "Unable to update authorization" });
    }
  }

  public cleanAuthorizationOfExpiredTokens(authorizationId: string): {
    removedAccessTokenIds: string[];
    removedRefreshTokenIds: string[];
  } {
    //TODO
    return null;
  }
}



// Conversion functions

// Converts from an Authorization object to a DDBAuthorization object.
// Migrates legacy token fields (accessToken/accessTokenInfo, refreshToken/refreshTokenInfo) into the new array fields if necessary.
const convertToDDBAuthorization = (authorization: Authorization): DDBAuthorization => {
  console.log(`[convertToDDBAuthorization] Converting authorization: ${JSON.stringify(authorization, null, 2)}`);
  const auth: DDBAuthorization = {
    ...authorization,
    authCodeInfo: authorization.authCodeInfo
      ? {
        ...authorization.authCodeInfo,
        expiresAt: authorization.authCodeInfo.expiresAt.toString(),
      }
      : undefined,
    accessTokenInfo: authorization.accessTokenInfo
      ? {
        ...authorization.accessTokenInfo,
        issuedAt: authorization.accessTokenInfo.issuedAt.toString(),
        expiresAt: authorization.accessTokenInfo.expiresAt.toString(),
      }
      : undefined,
    // Store token IDs in the arrays
    accessTokens: authorization.accessTokens ? authorization.accessTokens.map(token => token.tokenId) : undefined,
    refreshTokenInfo: authorization.refreshTokenInfo
      ? {
        ...authorization.refreshTokenInfo,
        issuedAt: authorization.refreshTokenInfo.issuedAt.toString(),
        expiresAt: authorization.refreshTokenInfo.expiresAt.toString(),
      }
      : undefined,
    refreshTokens: authorization.refreshTokens ? authorization.refreshTokens.map(token => token.tokenId) : undefined,
    created: authorization.created.toString(),
    lastUpdatedDate: authorization.lastUpdatedDate ? authorization.lastUpdatedDate.toString() : undefined,
  };

  // Handle legacy fields
  if (authorization.accessToken && authorization.accessTokenInfo && (!auth.accessTokens || auth.accessTokens.length === 0)) {
    // Create a token ID for the legacy token
    const legacyTokenId = `token.legacy.access.${uuidv4()}`;
    auth.accessTokens = [legacyTokenId];
  }

  if (authorization.refreshToken && authorization.refreshTokenInfo && (!auth.refreshTokens || auth.refreshTokens.length === 0)) {
    // Create a token ID for the legacy token
    const legacyTokenId = `token.legacy.refresh.${uuidv4()}`;
    auth.refreshTokens = [legacyTokenId];
  }

  if (auth.lastUpdatedDate === undefined || auth.lastUpdatedDate === null) delete auth.lastUpdatedDate;
  return auth;
};

// Converts from a DDBAuthorization object to an Authorization object.
// This function fetches the actual tokens from the token table
const convertFromDDBAuthorization = async (authorization: DDBAuthorization): Promise<Authorization> => {
  console.log(`[convertFromDDBAuthorization] Converting authorization: ${JSON.stringify(authorization, (key, value) => {
  if (value && typeof value === 'object') {
    const depth = key === '' ? 0 : 1;
    if (depth >= 2) return '[Object]';
  }
  return value;
}, 2)}`);
  // Initialize empty token arrays
  let accessTokens: Token[] = [];
  let refreshTokens: Token[] = [];

  // Fetch tokens using the token accessor if we have an authorization ID
  if (authorization.authorizationId) {
    try {
      const tokenAccessor = getTokenAccessor();
      const allTokens = await tokenAccessor.getTokensByAuthorizationId(authorization.authorizationId);

      // Separate tokens by type
      accessTokens = allTokens.filter(token => token.tokenType === "access");
      refreshTokens = allTokens.filter(token => token.tokenType === "refresh");

      console.log(`[convertFromDDBAuthorization] Fetched ${accessTokens.length} access tokens and ${refreshTokens.length} refresh tokens`);
    } catch (error) {
      console.error(`[convertFromDDBAuthorization] Error fetching tokens for authorization ${authorization.authorizationId}:`, error);
    }
  }

  // If we have legacy tokens, convert them to the new format
  if (authorization.accessToken && authorization.accessTokenInfo) {
    const legacyAccessToken: Token = {
      tokenId: `token.legacy.access.${uuidv4()}`,
      token: authorization.accessToken,
      authorizationId: authorization.authorizationId || "",
      sessionId: "1",
      userId: authorization.userId,
      clientId: authorization.clientId,
      tokenType: "access",
      issuedAt: Temporal.Instant.from(authorization.accessTokenInfo.issuedAt),
      expiresAt: Temporal.Instant.from(authorization.accessTokenInfo.expiresAt),
    };
    accessTokens.push(legacyAccessToken);
  }

  if (authorization.refreshToken && authorization.refreshTokenInfo) {
    const legacyRefreshToken: Token = {
      tokenId: `token.legacy.refresh.${uuidv4()}`,
      token: authorization.refreshToken,
      authorizationId: authorization.authorizationId || "",
      sessionId: "1",
      userId: authorization.userId,
      clientId: authorization.clientId,
      tokenType: "refresh",
      issuedAt: Temporal.Instant.from(authorization.refreshTokenInfo.issuedAt),
      expiresAt: Temporal.Instant.from(authorization.refreshTokenInfo.expiresAt),
    };
    refreshTokens.push(legacyRefreshToken);
  }

  const auth: Authorization = {
    ...authorization,
    authCodeInfo: authorization.authCodeInfo
      ? {
        ...authorization.authCodeInfo,
        expiresAt: Temporal.Instant.from(authorization.authCodeInfo.expiresAt),
      }
      : undefined,
    accessTokenInfo: undefined, // legacy field removed in favor of accessTokens
    accessTokens: accessTokens,
    refreshTokenInfo: authorization.refreshTokenInfo
      ? {
        ...authorization.refreshTokenInfo,
        issuedAt: Temporal.Instant.from(authorization.refreshTokenInfo.issuedAt),
        expiresAt: Temporal.Instant.from(authorization.refreshTokenInfo.expiresAt),
      }
      : undefined,
    refreshTokens: refreshTokens,
    created: Temporal.Instant.from(authorization.created),
    lastUpdatedDate: authorization.lastUpdatedDate ? Temporal.Instant.from(authorization.lastUpdatedDate) : undefined,
  };

  return auth;
};
