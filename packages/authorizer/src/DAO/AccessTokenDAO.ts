

import { Temporal } from 'temporal-polyfill';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

export interface AccessTokenInfo {
    clientId: string;
    userId: string;
    scopes: string[];
    expiresAt: Temporal.Instant;
}

abstract class AccessTokenValidator {
    abstract checkToken(token: string): Promise<AccessTokenInfo>;
}

export class DynamoDBAccessTokenValidator extends AccessTokenValidator {
    private dynamodbClient: DynamoDBDocumentClient;

    constructor() {
        super();
        const client = new DynamoDBClient({});
        this.dynamodbClient = DynamoDBDocumentClient.from(client);
    }

    static getInstance() {
        return new DynamoDBAccessTokenValidator();
    }

    async checkToken(token: string): Promise<AccessTokenInfo> {
        console.log('[DynamoDBAccessTokenValidator.checkToken] Validating token');
        const params = {
            TableName: process.env.AUTHORIZATIONS_TABLE_NAME,
            IndexName: process.env.AUTHORIZATIONS_BY_ACCESS_TOKEN_INDEX_NAME,
            KeyConditionExpression: 'accessToken = :token',
            ExpressionAttributeValues: {
                ':token': token
            }
        };

        try {
            console.log('[DynamoDBAccessTokenValidator.checkToken] Querying DynamoDB');
            const { Items } = await this.dynamodbClient.send(new QueryCommand(params));

            if (!Items || Items.length === 0) {
                console.log('[DynamoDBAccessTokenValidator.checkToken] Token not found');
                throw new Error('Token not found');
            }

            const tokenItem = Items[0];
            const { accessTokenInfo, scopes, clientId, userId } = tokenItem;

            // Parse expiration date
            console.log('[DynamoDBAccessTokenValidator.checkToken] Parsing expiration date');
            const expiresAt = Temporal.Instant.from(accessTokenInfo.expiresAt);

            // Check if token is expired
            console.log('[DynamoDBAccessTokenValidator.checkToken] Checking token expiration');
            if (Temporal.Instant.compare(Temporal.Now.instant(), expiresAt) >= 0) {
                console.log('[DynamoDBAccessTokenValidator.checkToken] Token has expired.  Token expired at:', expiresAt.toString(), 'Current time:', Temporal.Now.instant().toString() + ', a difference of:', Temporal.Now.instant().since(expiresAt).toString() + ' has passed');
                throw new Error('Token has expired');
            }

            console.log('[DynamoDBAccessTokenValidator.checkToken] Token validation successful');
            return {
                clientId,
                userId,
                scopes,
                expiresAt
            };
        } catch (error) {
            console.error('[DynamoDBAccessTokenValidator.checkToken] Error validating token:', error);
            throw error;
        }
    }
}

export class FakeAccessTokenValidator extends AccessTokenValidator {
    static getInstance() {
        return new FakeAccessTokenValidator();
    }
    async checkToken(token: string): Promise<AccessTokenInfo> {
        throw new Error("Method not implemented.");
        return {
            clientId: 'fake-client-id',
            userId: 'fake-user-id',
            scopes: ['fake-scope'],
            expiresAt: Temporal.Instant.from('2025-03-19T00:00:00')
        }
    }
}
