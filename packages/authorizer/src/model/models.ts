import { IronSpiderService } from "iron-spider-ssdk"
export interface PolicyStatement {
    Action: string;
    Effect: 'Allow' | 'Deny';
    Resource: string;
}

export interface PolicyDocument {
    Version: string;
    Statement: PolicyStatement[];
}

export interface AuthorizerPolicy {
    principalId?: string;
    policyDocument?: PolicyDocument;
    context?: HandlerContext | { [key: string]: string | number | boolean };
}
export interface event {
    "type": "REQUEST",
    "methodArn": string,
    "resource": string,
    "path": string,
    "httpMethod":   string,
    "headers": {
        [key: string]: string,
        "spider-access-token": string,
      
    },
    "queryStringParameters": {
      [key: string]: string
    },
    "requestContext": {
      "path": string,
      "operationName": keyof IronSpiderService<any>,
      "extendedRequestId": string,
      "accountId": string,
      "resourceId": string,
      "stage": string,
      "requestId": string,
      "identity": {
        "apiKey": string,
        "sourceIp": string
        "clientCert": {
          [key: string]: string
          }
        }
      },
      "resourcePath": string,
      "apiId": string
    }
  /**
  * Defines anything the operation handler needs that is not modeled in the operation's Smithy model but comes from
  * other context, in this case my lambda authorizer
  */
 export interface HandlerContext {
   //legacy
   /**
    * @deprecated
    */
   user?: string;
 
   //new
   userId?: string;
   displayName?: string;
   siteAccess?: string
   apiAccess?: string
   tokenExpiry?: string,
   oauth?: string;//{
    // clientId?: string;
// }
   // Performance timing metrics
   authV1DurationMs?: number;
   authV2DurationMs?: number;
   totalAuthDurationMs?: number;
 }