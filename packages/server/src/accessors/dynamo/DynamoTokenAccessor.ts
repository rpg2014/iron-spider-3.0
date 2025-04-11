import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { OAuthTokenAccessor } from "../AccessorInterfaces";
import { InternalServerError, BadRequestError } from "iron-spider-ssdk";
import { DDBToken, Token } from "src/model/Auth/oauthModels";
import { Temporal } from "temporal-polyfill";

/**
 * DynamoDB implementation of the OAuthTokenAccessor
 */
export class DynamoTokenAccessor extends OAuthTokenAccessor {
  private TABLE_NAME: string = process.env.TOKENS_TABLE_NAME as string;
  private BY_TOKEN_INDEX_NAME = process.env.TOKENS_BY_TOKEN_INDEX_NAME as string;
  private BY_AUTHORIZATION_ID_INDEX_NAME = process.env.TOKENS_BY_AUTHORIZATION_ID_INDEX_NAME as string;
  private readonly client;
  private ddbdocClient;

  constructor() {
    super();
    // create dynamo db client
    this.client = new DynamoDBClient({});
    this.ddbdocClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        // This can cause issues if I accidentally pass a real class in. Would rather fail fast here.
        // convertClassInstanceToMap: true
      },
    });
  }

  /**
   * Get a token by its token value
   * TODO: Change to Get Command on token index
   * @param token The token value to look up
   * @returns The token object if found
   */
  async getToken(token: string): Promise<Token> {
    try {
      const result = await this.ddbdocClient.send(
        new QueryCommand({
          TableName: this.TABLE_NAME,
          IndexName: this.BY_TOKEN_INDEX_NAME,
          KeyConditionExpression: "token = :token",
          ExpressionAttributeValues: {
            ":token": token,
          },
        }),
      );

      if (!result.Items || result.Items.length === 0) {
        throw new BadRequestError({ message: "Token not found" });
      }

      const ddbToken = result.Items[0] as DDBToken;
      return this.convertFromDDBToken(ddbToken);
    } catch (error) {
      console.error("Error getting token:", error);
      throw new InternalServerError({ message: "Unable to retrieve token" });
    }
  }

  /**
   * Get a token by its ID
   * @param tokenId The token ID to look up
   * @returns The token object if found
   */
  async getTokenById(tokenId: string): Promise<Token> {
    try {
      const result = await this.ddbdocClient.send(
        new GetCommand({
          TableName: this.TABLE_NAME,
          Key: {
            tokenId,
          },
        }),
      );

      if (!result.Item) {
        throw new BadRequestError({ message: "Token not found" });
      }

      const ddbToken = result.Item as DDBToken;
      return this.convertFromDDBToken(ddbToken);
    } catch (error) {
      console.error("Error getting token by ID:", error);
      throw new InternalServerError({ message: "Unable to retrieve token" });
    }
  }

  /**
   * Get all tokens for a specific authorization
   * @param authorizationId The authorization ID to look up tokens for
   * @returns Array of token objects
   */
  async getTokensByAuthorizationId(authorizationId: string): Promise<Token[]> {
    try {
      const result = await this.ddbdocClient.send(
        new QueryCommand({
          TableName: this.TABLE_NAME,
          IndexName: this.BY_AUTHORIZATION_ID_INDEX_NAME,
          KeyConditionExpression: "authorizationId = :authorizationId",
          ExpressionAttributeValues: {
            ":authorizationId": authorizationId,
          },
        }),
      );

      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      return result.Items.map(item => this.convertFromDDBToken(item as DDBToken));
    } catch (error) {
      console.error("Error getting tokens by authorization ID:", error);
      throw new InternalServerError({ message: "Unable to retrieve tokens" });
    }
  }

  /**
   * Create a new token
   * @param token The token object to create
   * @returns The ID of the created token
   */
  async createToken(token: Token): Promise<string> {
    try {
      // Ensure token has a tokenId
      if (!token.tokenId) {
        token.tokenId = `token.${uuidv4()}`;
      }

      const ddbToken = this.convertToDDBToken(token);

      await this.ddbdocClient.send(
        new PutCommand({
          TableName: this.TABLE_NAME,
          Item: ddbToken,
        }),
      );

      return token.tokenId;
    } catch (error) {
      console.error("Error creating token:", error);
      throw new InternalServerError({ message: "Unable to create token" });
    }
  }

  /**
   * Delete a token by its ID
   * @param tokenId The ID of the token to delete
   */
  async deleteToken(tokenId: string): Promise<void> {
    try {
      await this.ddbdocClient.send(
        new DeleteCommand({
          TableName: this.TABLE_NAME,
          Key: {
            tokenId,
          },
        }),
      );
    } catch (error) {
      console.error("Error deleting token:", error);
      throw new InternalServerError({ message: "Unable to delete token" });
    }
  }

  /**
   * Delete all tokens for a specific authorization
   * @param authorizationId The authorization ID to delete tokens for
   */
  async deleteTokensByAuthorizationId(authorizationId: string): Promise<void> {
    try {
      // First, get all tokens for this authorization
      const tokens = await this.getTokensByAuthorizationId(authorizationId);

      if (tokens.length === 0) {
        return;
      }

      // DynamoDB batch operations can handle up to 25 items at once
      const batchSize = 25;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);

        const deleteRequests = batch.map(token => ({
          DeleteRequest: {
            Key: {
              tokenId: token.tokenId,
            },
          },
        }));

        await this.ddbdocClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [this.TABLE_NAME]: deleteRequests,
            },
          }),
        );
      }
    } catch (error) {
      console.error("Error deleting tokens by authorization ID:", error);
      throw new InternalServerError({ message: "Unable to delete tokens" });
    }
  }

  /**
   * Convert a DDBToken to a Token
   * @param ddbToken The DynamoDB token representation
   * @returns The application token representation
   */
  private convertFromDDBToken(ddbToken: DDBToken): Token {
    return {
      ...ddbToken,
      issuedAt: Temporal.Instant.from(ddbToken.issuedAt),
      expiresAt: Temporal.Instant.from(ddbToken.expiresAt),
    };
  }

  /**
   * Convert a Token to a DDBToken
   * @param token The application token representation
   * @returns The DynamoDB token representation
   */
  private convertToDDBToken(token: Token): DDBToken {
    return {
      ...token,
      issuedAt: token.issuedAt.toString(),
      expiresAt: token.expiresAt.toString(),
    };
  }

  /**
   * Creates a token object with standard fields
   * @param tokenValue The actual token value
   * @param authorizationId The authorization ID this token belongs to
   * @param userId The user ID this token belongs to
   * @param clientId The client ID this token belongs to
   * @param tokenType The type of token ('access' or 'refresh')
   * @param scopes The scopes associated with this token
   * @param expiresInSeconds The number of seconds until the token expires
   * @returns A fully formed Token object ready to be stored
   */
  createTokenObject(
    tokenValue: string,
    authorizationId: string,
    userId: string,
    clientId: string,
    tokenType: "access" | "refresh",
    scopes: string[],
    expiresInSeconds: number,
  ): Token {
    return {
      tokenId: `pg.token.${uuidv4()}`,
      token: tokenValue,
      authorizationId,
      userId,
      clientId,
      tokenType,
      scopes,
      issuedAt: Temporal.Now.instant(),
      expiresAt: Temporal.Now.instant().add({ seconds: expiresInSeconds }),
    };
  }
}
