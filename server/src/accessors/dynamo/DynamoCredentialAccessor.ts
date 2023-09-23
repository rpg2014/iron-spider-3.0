import { CredentialsAccessor } from "../AccessorInterfaces";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, PutCommandOutput, QueryCommand, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { CredentialModel } from "../../model/Auth/authModels";
import process from "process";

export class DynamoCredentialsAccessor extends CredentialsAccessor {
  private TABLE_NAME: string = process.env.CREDENTIALS_TABLE_NAME as string;
  private BY_USER_SECONDARY_INDEX_NAME = process.env.CREDENTIALS_BY_USER_INDEX_NAME as string;
  private client;

  public constructor() {
    super();
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }
  async getCredential(credentialId: Uint8Array): Promise<CredentialModel | undefined> {
    const output = await this.client.send(
      new GetCommand({
        TableName: this.TABLE_NAME,
        Key: credentialId,
      })
    );
    return output.Item ? (output.Item as CredentialModel) : undefined;
  }

  async getCredentialsForUser(userId: String): Promise<CredentialModel[]> {
    const output: QueryCommandOutput = await this.client.send(
      new QueryCommand({
        TableName: this.TABLE_NAME,
        IndexName: this.BY_USER_SECONDARY_INDEX_NAME,
        KeyConditionExpression: "userID = :userID",
        ExpressionAttributeValues: {
          ":userID": userId,
        },
      })
    );
    return output.Items as CredentialModel[];
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
}
