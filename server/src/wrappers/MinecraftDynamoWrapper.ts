import { AttributeValue, DynamoDBClient, GetItemCommand, GetItemCommandInput, UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import { InternalServerError } from "iron-spider-ssdk";

const ITEM_ID = "itemId";
const VALUE = "value";
const SERVER_RUNNING: string = "serverRunning";
const INSTANCE_ID: string = "instanceId";
const SNAPSHOT_ID: string = "snapshotId";
const AMI_ID: string = "amiId"
const TABLE_NAME: string = 'minecraftServerDetails';

type GetItemOptions = {
    consistantRead?: boolean;
    // type: "BOOL" | "S"
}
export class MinecraftDBWrapper {
    dynamoClient: DynamoDBClient;
    constructor() {
        this.dynamoClient = new DynamoDBClient({ region: "us-east-1" })
    }

    /**
     * 
     */
    public async isServerRunning(): Promise<boolean> {
        const isServerRunning: boolean = await this.getItemB(SERVER_RUNNING)
        return isServerRunning
    }

    public async setServerRunning(): Promise<void> {
        await this.setItem(SERVER_RUNNING, true);
    }

    public async setServerStopped(): Promise<void> {
        await this.setItem(SERVER_RUNNING, false)
    }

    public async getInstanceId(): Promise<string> {
        const instanceId = await this.getItemS(INSTANCE_ID)
        if (!instanceId) {
            throw new InternalServerError({ message: `Unable to fetch instance id from Dynamo` })
        }
        return instanceId
    }

    public async setInstanceId(instanceId: string) {
        await this.setItem(INSTANCE_ID, instanceId);
    }

    public async getSnapshotId(): Promise<string | undefined> {
        return await this.getItemS(SNAPSHOT_ID)
    }

    public async setSnapshotId(snapshotId: string) {
        await this.setItem(SNAPSHOT_ID, snapshotId);
    }

    public async getAmiId(): Promise<string | undefined> {
        return await this.getItemS(AMI_ID)
    }

    /**
     * setAmiId
     */
    public async setAmiId(amiId: string) {
        await this.setItem(AMI_ID, amiId)
    }

    private async getItemB(itemId: string, options?: GetItemOptions): Promise<boolean> {
        const item = await this.getItem(itemId, "BOOL", options || { consistantRead: false })
        if (item.BOOL === undefined) {
            throw new InternalServerError({ message: `Unable to fetch ${itemId} from table ${TABLE_NAME}` })
        }
        return item.BOOL;
    }

    private async getItemS(itemId: string, options?: GetItemOptions): Promise<string> {
        const item = await this.getItem(itemId, "S", options || { consistantRead: false })
        if (item.S === undefined) {
            throw new InternalServerError({ message: `Unable to fetch ${itemId} from table ${TABLE_NAME}` })
        }
        return item.S
    }

    private async getItem(itemId: string, type: "BOOL" | "S", options?: GetItemOptions): Promise<AttributeValue> {

        const input: GetItemCommandInput = {
            TableName: TABLE_NAME,
            Key: {
                itemId: { "S": itemId }
            },
            ConsistentRead: options?.consistantRead
        }
        const command = new GetItemCommand(input)
        const response = await this.dynamoClient.send(command);
        if (!response.Item) {
            throw new InternalServerError({ message: "Unable to get item: " + itemId })
        }
        // console.debug(`Got Item from dynamo`, JSON.stringify(response.Item))
        return response.Item[VALUE]
    }

    private async setItem(itemId: string, value: boolean | string): Promise<void> {
        const input: UpdateItemCommandInput = {
            TableName: TABLE_NAME,
            Key: {
                "itemId": { "S": itemId }
            },
            UpdateExpression: "SET #val = :v",
            ExpressionAttributeNames: {
                "#val": "value" 
            },
            ExpressionAttributeValues: {
                ":v": { [typeof value === "boolean" ? "BOOL" : "S"]: value } as unknown as AttributeValue,
            },
            ReturnValues: "ALL_NEW"
        }
        try {
            // console.debug(`Dynamo DB UpdateItem input: ${JSON.stringify(input)}`)
            const response = await this.dynamoClient.send(new UpdateItemCommand(input));
            // console.debug("Updated Value")
            // console.debug(`Updated value to: ${typeof value === 'boolean' ? response.Attributes?.[VALUE].BOOL :response.Attributes?.[VALUE].S}`);
        } catch (e) {
            console.error(`Unable to set item: ${itemId} to value: ${value}`,e , JSON.stringify(e))
            throw new InternalServerError({ message: `Unable to set item: ${itemId} to value: ${value}` })
        }
    }
}