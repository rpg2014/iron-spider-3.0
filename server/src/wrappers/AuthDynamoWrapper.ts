import { DynamoDBClient } from "@aws-sdk/client-dynamodb";


export class AuthDBWrapper {
    dynamoClient: DynamoDBClient;
    constructor() {
        this.dynamoClient = new DynamoDBClient({region: "us-east-1"})
    }
    public isAuthorized(userName: string){}
    //TO be continued


}