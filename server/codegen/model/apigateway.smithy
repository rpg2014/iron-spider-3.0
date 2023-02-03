$version: "2"
namespace com.rpg2014.cloud

use aws.apigateway#integration
use aws.apigateway#authorizer
use aws.apigateway#authorizers
use aws.apigateway#apiKeySource

// All of the http methods MUST be POST, b/c thats how APIG has to call lambda as part of that integration.
apply Echo @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply Length @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply ServerStatus @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply ServerDetails @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply StartServer @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply StopServer @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

//Auth stuff
apply IronSpider @authorizers(
    "iron-auth": {
        scheme: httpApiKeyAuth,
        type: "request",
        identitySource: "method.request.header.spider-access-token",
        //lambda authorizor ARN, will be created later
        uri: "{{AUTH_FUNCTION_ARN}}",
        // Need to put the IAM role that the APIG can assume to call the auth function. 
        credentials: "{{AUTH_ROLE_ARN}}"
    }
)
apply IronSpider @authorizer("iron-auth")

apply IronSpider @apiKeySource("AUTHORIZER")
// apply IronSpider @aws.auth#cognitoUserPools(
//     providerArns: ["test"]
// )
