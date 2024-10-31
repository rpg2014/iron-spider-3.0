import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ConnectedUser, DateInfo, InternalServerError, NotFoundError } from "iron-spider-ssdk";
import { DateAccessor } from "../AccessorInterfaces";
import { getUserAccessor } from "../AccessorFactory";

export class DynamoDateAccessor extends DateAccessor {
  private client: DynamoDBDocumentClient;
  private tableName: string;
  private connectedUsersTableName: string;
  private userIndexName: string;
  /**
   * DDB's primary key is dateId, but the date info object uses id.  This is due to
   * smihty requireing dateId in some of the API's but thats ugly for the object
   * @param date
   * @returns
   */
  private convertToDDBDate(date: DateInfo): Record<string, any> {
    return {
      dateId: date.id,
      title: date.title,
      dateThrower: date.dateThrower,
      userId: date.userId,
      location: date.location,
      coordinates: date.coordinates,
      note: date.note,
      date: date.date?.toISOString(),
    };
  }
  private unconvertFromDDBDate(ddbDate: Record<string, any> | undefined): DateInfo {
    if (!ddbDate) throw new InternalServerError({ message: "Date object not given to the unconvertFromDDBDate function" });
    return {
      id: ddbDate.dateId,
      title: ddbDate.title,
      dateThrower: ddbDate.dateThrower,
      userId: ddbDate.userId,
      location: ddbDate.location,
      coordinates: ddbDate.coordinates,
      note: ddbDate.note,
      date: ddbDate.date ? new Date(ddbDate.date) : undefined,
    };
  }

  constructor() {
    super();
    const ddbClient = new DynamoDBClient({});
    this.client = DynamoDBDocumentClient.from(ddbClient);
    this.tableName = process.env.DATE_TABLE_NAME || "";
    this.userIndexName = process.env.DATE_USER_INDEX_NAME || "";
    this.connectedUsersTableName = process.env.CONNECTED_USERS_TABLE_NAME || "";
    //throw if any are empty
    if (!this.tableName || !this.userIndexName || !this.connectedUsersTableName) throw new Error("Missing environment variables");
  }

  async listDates(userId: string): Promise<DateInfo[]> {
    try {
      console.log("Listing dates for user:", userId);
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.userIndexName,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      });
      const response = await this.client.send(command);
      return response.Items?.map(date => this.unconvertFromDDBDate(date)) as DateInfo[];
    } catch (error) {
      console.error("Error listing dates:", error);
      throw error;
    }
  }

  async createDate(date: DateInfo): Promise<DateInfo> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: this.convertToDDBDate(date),
      });
      console.log("Creating date in DDB:", date);
      await this.client.send(command);
      return date;
    } catch (error) {
      console.error("Error creating date:", error);
      throw error;
    }
  }

  async getDate(dateId: string): Promise<DateInfo> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { dateId },
      });
      const response = await this.client.send(command);
      if (!response.Item) throw new NotFoundError({ message: "Date not found" });
      return this.unconvertFromDDBDate(response.Item as DateInfo);
    } catch (error) {
      console.error("Error getting date:", error);
      throw error;
    }
  }

  async updateDate(date: DateInfo): Promise<DateInfo> {
    throw new InternalServerError({ message: "Not implemented" });
    // try {
    //   const command = new UpdateCommand({
    //     TableName: this.tableName,
    //     Key: { dateId: date.id },
    //     UpdateExpression: "set #loc = :l, pictureId = :p",
    //     ExpressionAttributeNames: { "#loc": "location" },
    //     ExpressionAttributeValues: { ":l": date.location, ":p": date.pictureId },
    //     ReturnValues: "ALL_NEW",
    //   });
    //   const response = await this.client.send(command);
    //   return response.Attributes as DateInfo;
    // } catch (error) {
    //   console.error("Error updating date:", error);
    //   throw error;
    // }
  }

  async deleteDate(id: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { dateId: id },
      });
      await this.client.send(command);
    } catch (error) {
      console.error("Error deleting date:", error);
      throw error;
    }
  }

  async getConnectedUsers(userId: string): Promise<ConnectedUser[]> {
    console.log("Getting connected users for user:", userId);
    try {
      const command = new GetCommand({
        TableName: this.connectedUsersTableName,
        Key: { userId },
      });
      const response = await this.client.send(command);
      const userIds = response.Item?.connectedUsers as string[];
      const userAccessor = getUserAccessor();
      const users = await Promise.all(userIds.map(async id => userAccessor.getUser(id)));
      const connectedUsers = users.map(user => ({ userId: user.id, displayName: user.displayName } as ConnectedUser));
      console.log("Connected users from DDB:", connectedUsers);
      return connectedUsers;
    } catch (e) {
      console.error("Error getting connected users:", e);
      throw e;
    }
  }
}
