

// Auth constants

import { ManagedPolicy } from "aws-cdk-lib/aws-iam";

export const USER_TABLE_NAME = 'domainUsers';
export const CREDENTIAL_TABLE_NAME = 'PasskeyCredentials';


export const ALLOWED_ORIGINS =  [ "https://pwa.parkergiven.com", "https://auth.parkergiven.com"];


export const getMinecraftPolicies = () => {
    return [
        //TODO: Get policies from aws iam console for iron-spider-2.0 user, and copy them here.  
        ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonRoute53FullAccess")
    ]
}