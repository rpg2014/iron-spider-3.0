import {AttributeValue, DynamoDBClient, GetItemCommand, GetItemCommandInput, UpdateItemCommand, UpdateItemCommandInput}  from '@aws-sdk/client-dynamodb';

const ITEM_ID = "itemId";
const VALUE = "value";
const SERVER_RUNNING = "serverRunning";
const INSTANCE_ID = "instanceId";
const SNAPSHOT_ID = "snapshotId";
const AMI_ID = "amiId"
const TABLE_NAME = 'minecraftServerDetails';
export class MinecraftDBWrapper {
    dynamoClient: DynamoDBClient;
    constructor() {
        this.dynamoClient = new DynamoDBClient({region: "us-east-1"})
    }

    /**
     * 
     */
    public async isServerRunning(): Promise<boolean> {
        const item = await this.getItem(SERVER_RUNNING)
        return item[SERVER_RUNNING].BOOL
    }

    public async setServerRunning(): Promise<void> {
        await this.setItem(SERVER_RUNNING, true);
    }

    public async setServerStopped(): Promise<void> {
        await this.setItem(SERVER_RUNNING, false)
    }

    public async getInstanceId(){
        return await this.getItem(INSTANCE_ID).then(item => item[INSTANCE_ID].S)
    }
    public async setInstanceId(instanceId: string) {
        await this.setItem(INSTANCE_ID, instanceId);
    }
    public async getSnapshotId() {
        return await this.getItem(SNAPSHOT_ID).then(item => item[SNAPSHOT_ID].S);   
    }
    public async setSnapshotId(snapshotId: string) {
        await this.setItem(SNAPSHOT_ID, snapshotId);
    }
    public async getAmiId() {
        return await this.getItem(AMI_ID).then(item => item[AMI_ID].S)
    }
    /**
     * setAmiId
     */
    public async setAmiId(amiId: string) {
        await this.setItem(AMI_ID, amiId)
    }



    private async getItem(itemId: string, consistantRead: boolean = false): Promise<Record<string, AttributeValue>> {
    
        const input: GetItemCommandInput = {
            TableName: TABLE_NAME,
            Key: {
                itemId: {"S": itemId}
            },
            ConsistentRead: consistantRead
        }
        const command = new GetItemCommand(input)
        const response =  await dynamoClient.send(command);
        if(!response.Item) {
            throw new InternalServerError("Unable to get item: "+ itemId)
        }
        return response.Item
    }

    private async setItem(itemId: string, value: boolean | string): Promise<void> {
        const input: UpdateItemCommandInput = {
            TableName: TABLE_NAME,
            Key: {
                itemId: {"S": itemId},
                value: {[typeof value === "boolean" ? "B" : "S"]: value } as unknown as AttributeValue
            }
        }
        try {
            const response = await dynamoClient.send(new UpdateItemCommand(input));
        }catch (e) {
            throw new InternalServerError(`Unable to set item: ${itemId} to value: ${value}`)
        }
    }
}