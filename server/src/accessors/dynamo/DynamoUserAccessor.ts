import {UserAccessor} from "../AccessorInterfaces";
import {UserModel} from "../../model/Auth/authModels";
import {AttributeAction, AttributeValueUpdate, DynamoDBClient,} from "@aws-sdk/client-dynamodb";
import * as process from "process";
import {
    DynamoDBDocumentClient,
    GetCommand,
    GetCommandOutput,
    ScanCommand,
    ScanCommandOutput,
    UpdateCommand, UpdateCommandOutput
} from "@aws-sdk/lib-dynamodb";
import {BadRequestError} from "iron-spider-ssdk";


const marshallOptions = {

}
export class DynamoUserAccessor extends UserAccessor {
    private TABLE_NAME: string = process.env.USER_TABLE_NAME as string;
    private readonly client;
    private ddbdocClient;
    constructor() {
        super();
        // create dynamo db client
        this.client = new DynamoDBClient({});
        this.ddbdocClient = DynamoDBDocumentClient.from(this.client)
    }

    //Creates a user using the update item command
    async createUser(user: UserModel): Promise<void> {
        let updates: Record<string, AttributeValueUpdate> = {};
        Object.keys(user).filter(key => key !== "id").forEach((key : string)=> {
            updates[key] = {
                Action: AttributeAction.PUT,
                Value: user[key as keyof UserModel]
            } as AttributeValueUpdate
        }) ;
        const output: UpdateCommandOutput = await this.ddbdocClient.send(new UpdateCommand({
            TableName: this.TABLE_NAME,
            Key: {
                id: user.id
            },
            AttributeUpdates: updates
        }));


    }

    async getUser(id: string): Promise<UserModel> {
        const output: GetCommandOutput = await this.ddbdocClient.send(new GetCommand({
            TableName: this.TABLE_NAME,
            Key: {
                id: id
            }
        }));
        return output.Item as UserModel;
    }

    async getUserByEmailAndDisplayName(email: string, displayName: string): Promise<UserModel | null> {
        let result: ScanCommandOutput = await this.ddbdocClient.send(new ScanCommand({
            TableName: this.TABLE_NAME,
            FilterExpression: "#email = :email",
            ExpressionAttributeNames: {
                "#email": "email"
            },
            ExpressionAttributeValues: {
                ":email": email
            }
        }));
        if(!result.Items || result.Items.length === 0) {
            return null;
        }
        // if length is > 1 filter by the display name.
        if (result.Items.length > 1) {
            result.Items = result.Items.filter(item => item.displayName === displayName);

        }
        // if there is only one, return it.
        if (result.Items.length === 1) {
            return result.Items.pop() as UserModel;
            // if 0 then return null;
        }else {
            throw new BadRequestError({message: "More than one user with same email and display name"});
        }
    }

    async saveChallenge(userId: string, challenge: string): Promise<void> {
        await this.ddbdocClient.send(new UpdateCommand({
            TableName: this.TABLE_NAME,
            Key: {
                id: userId
            },
            AttributeUpdates: {
                challenge: {
                    Action: AttributeAction.PUT,
                    Value: challenge
                }
            }
        }));
    }



}