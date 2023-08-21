$version: "2"
namespace com.rpg2014.cloud

use aws.auth#sigv4
use aws.api#service
use aws.protocols#restJson1
use smithy.framework#ValidationException

@title("Various API's to support services")

// Cross-origin resource sharing allows resources to be requested from external domains.
// Cors should be enabled for externally facing services and disabled for internally facing services.
// Enabling cors will modify the OpenAPI spec used to define your API Gateway endpoint.
// Uncomment the line below to enable cross-origin resource sharing
@cors(origin: "https://pwa.parkergiven.com",additionalAllowedHeaders: ["Content-Type", "content-type"] )
@sigv4(name: "execute-api")
@restJson1
@service(sdkId: "IronSpider")
// Can only have 1 service, so look into resources to have journal + MC paths https://awslabs.github.io/smithy/2.0/spec/service-types.html#service-resources
//Smithy defines a resource as an entity with an identity that has a set of operations.
// it prob makes more sense to have a resource for Journal, but MC is a set of operations, really.
@httpApiKeyAuth(
    name: "spider-access-token",
    in: "header"
)
// need to remove the ui's content type header for inputs with no body, so all of them.  
service IronSpider {
    version: "2018-05-10",
    operations: [
        ServerStatus,
        ServerDetails,
        StartServer,
        StopServer,
        CreateUser,
        GenerateRegistrationOptions,
        VerifyRegistration],
}

@httpError(500)
@error("server")
structure InternalServerError {
    message: String
}

@httpError(400)
@error("client")
structure BadRequestError {
    message: String
}
// @http(code: 200, method: "POST", "/journal/new")
// operation JournalCreate  {
//     input: JournalCreateInput,
//     output: JournalCreateOutput,
// }

// structure JournalCreateInput {
//     text: String,
//     title: String,
//     dateTime: String,
//     isMarkdown: boolean
// }
// structure JournalCreateOutput {
//     success: boolean
// }
