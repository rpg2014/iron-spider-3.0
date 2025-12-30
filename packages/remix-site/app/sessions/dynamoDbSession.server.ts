import { createSessionStorage } from "react-router";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { authSessionCookie } from "./cookies.server";
import type { SessionData } from "./sessions.server";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Hardcode the table name since Lambda@Edge doesn't support environment variables
const TABLE_NAME = "RemixSiteSessionTable";

/**
 * Creates a DynamoDB-based session storage
 */
export function createDynamoDbSessionStorage() {
  return createSessionStorage({
    cookie: authSessionCookie,
    async createData(data, expires) {
      console.log("[DynamoDbSessionStorage] Creating new session");
      // Generate a unique ID for the session
      const id = `pg.remix.session.${crypto.randomUUID()}`;

      // Store the session data in DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            id,
            data,
            expires: expires ? Math.floor(expires.getTime() /1000) : undefined,
          },
        }),
      );

      console.log("[DynamoDbSessionStorage] Created session with ID:", id);
      return id;
    },

    async readData(id: string) {
      console.log("[DynamoDbSessionStorage] Reading session:", id);
      // Read the session data from DynamoDB with strong consistency
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { id },
          ConsistentRead: true, // Use strongly consistent reads
        }),
      );

      // If no data found or expired, return null
      if (!result.Item) {
        console.log("[DynamoDbSessionStorage] No session found for ID:", id);
        return null;
      }

      // Check if session has expired
      if (result.Item.expires < Math.floor(Date.now()/1000)) {
        console.log("[DynamoDbSessionStorage] Session expired, deleting:", id);
        // Delete expired session
        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id },
          }),
        );
        return null;
      }

      console.log("[DynamoDbSessionStorage] Successfully read session:", id);
      return result.Item.data as SessionData;
    },

    async updateData(id: string, data, expires) {
      console.log("[DynamoDbSessionStorage] Updating session:", id);
      // Update the session data in DynamoDB
      const updateExpression = expires ? "set #data = :data, expires = :expires" : "set #data = :data";

      const expressionAttributeValues = expires ? { ":data": data, ":expires": Math.floor(expires.getTime() /1000) } : { ":data": data };
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: {
            "#data": "data",
          },
          ExpressionAttributeValues: expressionAttributeValues,
        }),
      );
      console.log("[DynamoDbSessionStorage] Successfully updated session:", id);
    },

    async deleteData(id: string) {
      console.log("[DynamoDbSessionStorage] Deleting session:", id);
      // Delete the session data from DynamoDB
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { id },
        }),
      );
      console.log("[DynamoDbSessionStorage] Successfully deleted session:", id);
    },
  });
}
