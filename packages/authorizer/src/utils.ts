import { AuthorizerPolicy, HandlerContext, PolicyDocument } from "./model/models";



// Help function to generate an IAM policy
const generatePolicy = function(principalId: string, effect: string, resource: string, context?: any | HandlerContext): AuthorizerPolicy {
    // Required output:
    var authResponse: AuthorizerPolicy = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument: PolicyDocument = {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect as 'Allow' | 'Deny',
                Resource: resource
            }]
        };
        authResponse.policyDocument = policyDocument;
    }
    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = context;
    return authResponse;
}
     
export const generateAllow = function(principalId: string, resource: string, context?: HandlerContext) {
    return generatePolicy(principalId, 'Allow', resource, context);
}
     
export const generateDeny = function(principalId: string, resource: string, context?: any| {message: string}) {
    return generatePolicy(principalId, 'Deny', resource, context);
}