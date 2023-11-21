import { CredentialsAccessor } from "../AccessorInterfaces";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, PutCommandOutput, QueryCommand, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { CredentialModel } from "../../model/Auth/authModels";
import process from "process";
import { InternalServerError } from "iron-spider-ssdk";

export class DynamoCredentialsAccessor extends CredentialsAccessor {
  private TABLE_NAME: string = process.env.CREDENTIALS_TABLE_NAME as string;
  private BY_USER_SECONDARY_INDEX_NAME = process.env.CREDENTIALS_BY_USER_INDEX_NAME as string;
  private client;

  public constructor() {
    super();
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }
  async getCredential(credentialId: string): Promise<CredentialModel | undefined> {
    console.log(`Fetching credential: ${credentialId}`);
    const output = await this.client.send(
      new GetCommand({
        TableName: this.TABLE_NAME,
        Key: {
          credentialID: credentialId,
        },
      })
    );
    return output.Item ? (output.Item as CredentialModel) : undefined;
  }

  async getCredentialsForUser(userID: string): Promise<CredentialModel[]> {
    console.debug("Fetching Credentials for user: ", userID);
    try {
      const output: QueryCommandOutput = await this.client.send(
        new QueryCommand({
          TableName: this.TABLE_NAME,
          IndexName: this.BY_USER_SECONDARY_INDEX_NAME,
          KeyConditionExpression: "userID = :userID",
          ExpressionAttributeValues: {
            ":userID": userID,
          },
        })
      );
      return output.Items as CredentialModel[];
    } catch (error: any) {
      console.error("Error fetching credentials for user: ", error.message);
      throw new InternalServerError({ message: "Unable to fetch credentials for user" });
    }
  }

  async saveCredentials(credential: CredentialModel): Promise<void> {
    const output: PutCommandOutput = await this.client.send(
      new PutCommand({
        TableName: this.TABLE_NAME,
        Item: credential,
      })
    );
    return;
  }
  // update the dynamo db entry's counter
  async updateCounter(credentialId: String, newCount: number): Promise<void> {
    console.log("Updating counter for credential: " + credentialId + " to " + newCount);

    try {
      const output: PutCommandOutput = await this.client.send(
        new PutCommand({
          TableName: this.TABLE_NAME,
          Item: {
            credentialID: credentialId,
            counter: newCount,
          },
        })
      );
    } catch (e: any) {
      console.log("Error updating counter: " + e.message);
      throw new InternalServerError({ message: "Unable to update counter" });
    }
  }
}
