$version: "2"
namespace com.rpg2014.cloud

use aws.apigateway#integration
use aws.apigateway#authorizer
use aws.apigateway#authorizers
use aws.apigateway#apiKeySource
use com.rpg2014.cloud.date_tracker#GetDate
use com.rpg2014.cloud.date_tracker#ListDates
use com.rpg2014.cloud.date_tracker#UpdateDate
use com.rpg2014.cloud.date_tracker#DeleteDate
use com.rpg2014.cloud.date_tracker#CreateDate
use com.rpg2014.cloud.date_tracker#GetPicture
use com.rpg2014.cloud.date_tracker#CreatePicture
use com.rpg2014.cloud.date_tracker#DeletePicture
use com.rpg2014.cloud.date_tracker#SearchForLocation
use com.rpg2014.cloud.date_tracker#GetLocationByPlaceId

// All of the http methods MUST be POST, b/c thats how APIG has to call lambda as part of that integration.
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

apply GenerateRegistrationOptions @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply VerifyRegistration @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply CreateUser @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply GenerateAuthenticationOptions @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply VerifyAuthentication @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply UserInfo @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply Logout @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply GetPublicKeys @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply GetJwks @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

//date APis
apply CreateDate @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply GetDate @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply UpdateDate @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply DeleteDate @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply ListDates @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply SearchForLocation @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply GetLocationByPlaceId @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply GetPicture @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)

apply CreatePicture @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "POST",
    uri: ""
)
apply DeletePicture @aws.apigateway#integration(
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
        //lambda authorizor ARN, will be created later, in cdk
        uri: "{{AUTH_FUNCTION_ARN}}",
        // Need to put the IAM role that the APIG can assume to call the auth function. 
        credentials: "{{AUTH_ROLE_ARN}}",
        //Disables caching + reuse of auth responses, could be worth setting higher (nah b/c this api is called from the UI
        // and users will change their auth status frequently.)
        resultTtlInSeconds: 0
    }
)
apply IronSpider @authorizer("iron-auth")

apply IronSpider @apiKeySource("AUTHORIZER")
// apply IronSpider @aws.auth#cognitoUserPools(
//     providerArns: ["test"]
// )
