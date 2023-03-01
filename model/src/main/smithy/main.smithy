$version: "2"
namespace com.rpg2014.cloud

use aws.auth#sigv4
use aws.api#service
use aws.protocols#restJson1
use aws.apigateway#authorizer
use aws.apigateway#authorizers
use smithy.framework#ValidationException

@title("Lambda backend for spiderman")

// Cross-origin resource sharing allows resources to be requested from external domains.
// Cors should be enabled for externally facing services and disabled for internally facing services.
// Enabling cors will modify the OpenAPI spec used to define your API Gateway endpoint.
// Uncomment the line below to enable cross-origin resource sharing
@cors(origin: "https://pwa.parkergiven.com")
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
service IronSpider {
    version: "2018-05-10",
    operations: [ServerStatus, ServerDetails, StartServer, StopServer],
}


@readonly
@http(code: 200, method: "GET", uri: "/server/status")
operation ServerStatus {
    output: ServerStatusOutput,
    errors: [ValidationException, InternalServerError],
}

enum Status {
    PENDING = "Pending"
    RUNNING = "Running"
    SHUTTING_DOWN = "ShuttingDown"
    TERMINATED = "Terminated"
    STOPPING = "Stopping"
    STOPPED = "Stopped"
}

structure ServerStatusOutput {
    status: Status
}

@readonly
@http(code: 200, method: "GET", uri: "/server/details")
operation ServerDetails {
    output: ServerDetailsOutput,
    errors: [ValidationException, InternalServerError]
}

structure ServerDetailsOutput {
    domainName: String
}

structure StartServerOutput {
    serverStarted: Boolean
}

@http(code: 200, method: "POST", uri: "/server/start")
operation StartServer {
    output: StartServerOutput,
    errors: [ValidationException, InternalServerError],
}

structure StopServerOutput {
    serverStopping: Boolean,
}

@http(code:200, method: "POST", uri: "/server/stop")
operation StopServer {
    output: StopServerOutput,
    errors: [ValidationException, InternalServerError],
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

@httpError(500)
@error("server")
structure InternalServerError {
    message: String
}