import { AttributeValue, DynamoDBClient, GetItemCommand, GetItemCommandInput,  UpdateItemCommand, UpdateItemCommandInput } from "@aws-sdk/client-dynamodb";
import { InternalServerError } from "iron-spider-ssdk";


const USER_NAME = "username";
/**
 * Not actually sure if this is needed, as the authorizer is different in this codebase. also i dont really care anymore lol
 */
export class AuthDBWrapper {
    dynamoClient: DynamoDBClient;

    
    private HAS_ACCESS_VALUE_KEY = "hasAccess";
    private NUM_OF_STARTS_VALUE_KEY = "numberOfStarts";
    private TABLE_NAME = "MinecraftAuthZTable";
    constructor() {
        this.dynamoClient = new DynamoDBClient({region: "us-east-1"})
    }
    public isAuthorized(userName: string){}
    //TO be continued

   
    private async getItem(userName: string, type: "BOOL" | "S", options?: GetItemOptions): Promise<Record<string, AttributeValue>> {
    
        const input: GetItemCommandInput = {
            TableName: this.TABLE_NAME,
            Key: {
               USER_NAME: {"S": userName}
            },
            ConsistentRead: options?.consistantRead
        }
        const command = new GetItemCommand(input)
        const response =  await this.dynamoClient.send(command);
        if(!response.Item ) {
            throw new InternalServerError({message: "Unable to get item for user: "+ userName})
        }
        console.log(`Got Item {} from dynamo`, JSON.stringify(response.Item))
        return response.Item
    }

    private async createEntryForUser(){}
    private async setItem(itemId: string, value: boolean | string): Promise<void> {
        const input: UpdateItemCommandInput = {
            TableName: this.TABLE_NAME,
            Key: {
                itemId: {"S": itemId},
                value: {[typeof value === "boolean" ? "B" : "S"]: value } as unknown as AttributeValue
            }
        }
        try {
            const response = await this.dynamoClient.send(new UpdateItemCommand(input));
        }catch (e) {
            throw new InternalServerError({message: `Unable to set item: ${itemId} to value: ${value}`})
        }
    }
}