namespace com.rpg2014.cloud

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

// apply IronSpider @aws.auth#cognitoUserPools(
//     providerArns: ["test"]
// )
