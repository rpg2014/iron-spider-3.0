$version: "2"
namespace com.rpg2014.cloud

use aws.auth#sigv4
use aws.api#service
use aws.protocols#restJson1
use smithy.framework#ValidationException
use com.rpg2014.cloud.date_tracker#DateOuting
use com.rpg2014.cloud.date_tracker#GetLocationByPlaceId
use com.rpg2014.cloud.date_tracker#SearchForLocation
use com.rpg2014.cloud.date_tracker#GetConnectedUsers

@title("Various API's to support services")

// Cross-origin resource sharing allows resources to be requested from external domains.
// Cors should be enabled for externally facing services and disabled for internally facing services.
// Enabling cors will modify the OpenAPI spec used to define your API Gateway endpoint.
// Uncomment the line below to enable cross-origin resource sharing
// I've manually implemented my own CORS api
// @cors(origin: "*" ,additionalAllowedHeaders: ["Content-Type", "content-type"] )
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
    resources: [DateOuting],
    operations: [
        // MC server
        ServerStatus,
        ServerDetails,
        StartServer,
        StopServer,
        //Auth
        CreateUser,
        GenerateRegistrationOptions,
        VerifyRegistration,
        GenerateAuthenticationOptions,
        VerifyAuthentication,
        // auth related 
        UserInfo,
        GetPublicKeys,
        GetJwks,
        Logout,

        // support the date trackerW
        SearchForLocation, 
        GetLocationByPlaceId,
        GetConnectedUsers
        ],
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
@httpError(401)
@error("client")
structure NeedDomainAccessError {
    message: String
}

@httpError(404)
@error("client")
structure NotFoundError {
    message:  String
}


