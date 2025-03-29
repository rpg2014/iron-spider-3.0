import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { AuthorizationAccessor, RenewAuthParams } from "../AccessorInterfaces";
import { InternalServerError, BadRequestError, OAuthError } from "iron-spider-ssdk";
import { Authorization, CreateAuthorizationInput, DDBAuthorization, DDBToken, Token } from "src/model/Auth/oauthModels";
import { Temporal } from "temporal-polyfill";

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
    this.ddbdocClient = DynamoDBDocumentClient.from(this.client,{marshallOptions: {
      // This can cause issues if I accidentaly pass a real class in. Would rather fail fast here. 
      // convertClassInstanceToMap: true
    }});
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
      // todo pass this from the input
      codeChallengeMethod: code_challenge_method ? code_challenge_method : undefined,
      created: Temporal.Now.instant().toString(),
      lastUpdatedDate: Temporal.Now.instant().toString(),    
    };

    try {
      await this.ddbdocClient.send(
        new PutCommand({
          TableName: this.TABLE_NAME,
          Item: authorization,
        }),
      );

      return convertFromDDBAuthorization(authorization);
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

      return convertFromDDBAuthorization(authorization);
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

      return convertFromDDBAuthorization(authorization);
    } catch (error) {
      console.error("Error getting authorization:", error);
      throw new InternalServerError({ message: "Unable to retrieve authorization" });
    }
  }
  async renewAuthorization({ previousAuthId, code_challenge, code_challenge_method, userId }: RenewAuthParams): Promise<Authorization> {
    console.log("[DynamoAuthorizationAccessor.renewAuthorization] Starting renewal for previousAuthId:", previousAuthId);
    const previousAuth = await this.getAuthorizationById(previousAuthId, userId);
    console.log("[DynamoAuthorizationAccessor.renewAuthorization] Retrieved previous authorization");

    const authorization: DDBAuthorization = {
      ...convertToDDBAuthorization(previousAuth),
      authorizationId: previousAuth.authorizationId ? previousAuth.authorizationId : `pg.auth.${uuidv4()}`,
      authCode: this.generateAuthCode(),
      authCodeInfo: {
        used: false,
        expiresAt: this.generateAuthCodeExpiration(),
      },
      accessToken: undefined,
      refreshToken: undefined,
      codeChallenge: code_challenge ? code_challenge : undefined,
      // TODO pass this from input?
      codeChallengeMethod: code_challenge_method ? code_challenge_method : undefined,
      created: previousAuth.created.toString(),
      lastUpdatedDate: Temporal.Now.instant().toString(),
    };
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

      return convertFromDDBAuthorization(authorization);
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
      console.log(`[DyanmoAuthorizationAccessor.getAuthorizationByCode] Authorization found, previously used: ${authorization?.authCodeInfo?.used}, expiresAt: ${authorization?.authCodeInfo?.expiresAt}.`)
      // Compare is -1 if first time is before second time, 0 if equal, 1 if reverse
      if (authorization.authCodeInfo && !authorization.authCodeInfo.used && Temporal.Instant.compare(Temporal.Instant.from(authorization.authCodeInfo.expiresAt.toString()), Temporal.Now.instant()) > 0) {
        if (!authorization.authorizationId) {
          // this shouldn't happen
          console.log("Authorization id not found for auth code", authCode, authorization);
          throw new InternalServerError({ message: "Authorization id not found" });
        }
        return convertFromDDBAuthorization(authorization);
      } else {
        // if authcode is already used, then replay attack is happening and i should expire the whole key family. 
        console.log(`Auth code used: ${authorization?.authCodeInfo?.used}, expiresAt: ${authorization?.authCodeInfo?.expiresAt}`);
        const authCodeExpired = Temporal.Instant.compare(Temporal.Instant.from(authorization?.authCodeInfo?.expiresAt.toString()?? Temporal.Now.instant()), Temporal.Now.instant())
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
  async getAuthorizationByRefreshToken(refreshToken: string): Promise<Authorization> {
    try {
      const result = await this.ddbdocClient.send(
        new QueryCommand({
          TableName: this.TABLE_NAME,
          IndexName: this.BY_REFRESH_TOKEN_INDEX_NAME,
          KeyConditionExpression: "refreshToken = :refreshToken",
          ExpressionAttributeValues: {
            ":refreshToken": refreshToken,
          },
        }),
      );

      if (!result.Items || result.Items.length === 0 || result.Items.length > 1) {
        console.log("Authorization not found");
        throw new OAuthError({ message: "Authorization not found", error: "invalid_grant", error_description: "Authorization not found" });
      }
      const authorization = result.Items[0] as DDBAuthorization;
      
      if (authorization.refreshTokenInfo && Temporal.Instant.compare(Temporal.Instant.from(authorization.refreshTokenInfo.expiresAt.toString()), Temporal.Now.instant()) > 0) {
        return convertFromDDBAuthorization(authorization);
      } else {
        throw new OAuthError({
          message: "Refresh token expired",
          error: "invalid_grant",
          error_description: "Refresh token expired",
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

  private generateAuthCodeExpiration = () => Temporal.Now.instant().add({minutes: 10}).toString();

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
            ":expiresAt": Temporal.Now.instant().toString()
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
  async setAccessAndRefreshToken({
    authorizationId,
    userId,
    accessToken,
    refreshToken,
    accessTokenInfo,
    refreshTokenInfo,
  }: {
    authorizationId: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    accessTokenInfo: {
      issuedAt: string;
      expiresAt: string;
    };
    refreshTokenInfo: {
      issuedAt: string;
      expiresAt: string;
    };
  }): Promise<void> {
    try {
      // convert objects into Record<string, string>
      const accessInfo: Record<string, string> = {}
      const refreshInfo: Record<string, string> = {}
      Object.entries(accessTokenInfo).forEach(([k,v]) =>{
        if(typeof v === "string")
          accessInfo[k] = v;
        
      })
      Object.entries(refreshTokenInfo).forEach(([k, v]) =>{
        if(typeof v === "string")
          refreshInfo[k] = v;

      })
      await this.ddbdocClient.send(
        new UpdateCommand({
          TableName: this.TABLE_NAME,
          Key: {
            authorizationId,
            userId: userId,
          },
          // also set accessToken and refreshToken info objects, with times from the jwts
          UpdateExpression: "set accessToken = :accessToken, refreshToken = :refreshToken, accessTokenInfo = :accessTokenInfo, refreshTokenInfo = :refreshTokenInfo, lastUpdatedDate = :lastUpdatedDate",
          ExpressionAttributeValues: {
            ":accessToken": accessToken,
            ":refreshToken": refreshToken,
            
            ":accessTokenInfo": accessInfo,
            ":refreshTokenInfo": refreshInfo,
            ":lastUpdatedDate": Temporal.Now.instant().toString(),
          },
          ReturnValues: "ALL_NEW",
        }),
      );
      console.log("Access and refresh token set");
      return;
    } catch (error) {
      console.error("Error setting access and refresh token:", error);
      throw new InternalServerError({ message: "Unable to set access and refresh token" });
    }
  }
}

// this function converts from an authorization object to a DDBAuthorization object
const convertToDDBAuthorization = (authorization: Authorization): DDBAuthorization => {
  console.log(`[convertToDDBAuthorization] Converting authorization: ${JSON.stringify(authorization, null, 2)}`)
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
    accessTokens: authorization.accessTokens?.map(convertToDDBToken),
    refreshTokenInfo: authorization.refreshTokenInfo
      ? {
          ...authorization.refreshTokenInfo,
          issuedAt: authorization.refreshTokenInfo.issuedAt.toString(),
          expiresAt: authorization.refreshTokenInfo.expiresAt.toString(),
        }
      : undefined,
    refreshTokens: authorization.refreshTokens?.map(convertToDDBToken),
    created: authorization.created.toString(),
    lastUpdatedDate: authorization.lastUpdatedDate ? authorization.lastUpdatedDate.toString() : undefined,
  };
  if(auth.lastUpdatedDate === undefined || auth.lastUpdatedDate === null) 
    delete auth.lastUpdatedDate;
  return auth;
};

// this function converts from a DDBAuthorization object to an authorization object
const convertFromDDBAuthorization = (authorization: DDBAuthorization): Authorization => {
  console.log(`[convertFromDDBAuthorization] Converting authorization: ${JSON.stringify(authorization, null, 2)}`)
  const auth: Authorization =  {
    ...authorization,
    authCodeInfo: authorization.authCodeInfo
      ? {
          ...authorization.authCodeInfo,
          expiresAt: Temporal.Instant.from(authorization.authCodeInfo.expiresAt),
        }
      : undefined,
    accessTokenInfo: authorization.accessTokenInfo
      ? {
          ...authorization.accessTokenInfo,
          issuedAt: Temporal.Instant.from(authorization.accessTokenInfo.issuedAt),
          expiresAt: Temporal.Instant.from(authorization.accessTokenInfo.expiresAt),
        }
      : undefined,
    accessTokens: authorization.accessTokens?.map(convertFromDDBToken),
    refreshTokenInfo: authorization.refreshTokenInfo
      ? {
          ...authorization.refreshTokenInfo,
          issuedAt: Temporal.Instant.from(authorization.refreshTokenInfo.issuedAt),
          expiresAt: Temporal.Instant.from(authorization.refreshTokenInfo.expiresAt),
        }
      : undefined,
    refreshTokens: authorization.refreshTokens?.map(convertFromDDBToken),
    created:  Temporal.Instant.from(authorization.created),
    lastUpdatedDate: authorization.lastUpdatedDate ? Temporal.Instant.from(authorization.lastUpdatedDate) : undefined,
  };
  return auth;
};

// DDBToken to Token and viceversa converters

const convertFromDDBToken = (token: DDBToken): Token => {
  return {
    ...token,
    issuedAt: Temporal.Instant.from(token.issuedAt),
    expiresAt: Temporal.Instant.from(token.expiresAt),
  };
};

const convertToDDBToken = (token: Token): DDBToken => {
  return {
    ...token,
    issuedAt: token.issuedAt.toString(),
    expiresAt: token.expiresAt.toString(),
  };
};