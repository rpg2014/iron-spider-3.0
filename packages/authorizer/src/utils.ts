import { HandlerContext } from "./model/models";

// Help function to generate an IAM policy
const generatePolicy = function(principalId: string, effect: string, resource: string, context?: any) {
    // Required output:
    var authResponse: {
        principalId?: string,
        policyDocument?: any,
        context?: {
            [key: string]: string | number | boolean
        }
    } = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument:any = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        var statementOne:any = {};
        statementOne.Action = 'execute-api:Invoke'; // default action
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = context;
    return authResponse;
}
     
export const generateAllow = function(principalId: string, resource: string, context?: HandlerContext) {
    return generatePolicy(principalId, 'Allow', resource, context);
}
     
export const generateDeny = function(principalId: string, resource: string,context?: any) {
    return generatePolicy(principalId, 'Deny', resource,context);
}