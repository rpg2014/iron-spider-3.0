$version: "2"
namespace com.rpg2014.cloud

use aws.apigateway#integration

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
    httpMethod: "GET",
    uri: ""
)

apply ServerDetails @aws.apigateway#integration(
    type: "aws_proxy",
    httpMethod: "GET",
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
// apply IronSpider @aws.auth#cognitoUserPools(
//     providerArns: ["test"]
// )
