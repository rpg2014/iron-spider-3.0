$version: "2"
namespace com.rpg2014.cloud

use aws.auth#sigv4
use aws.protocols#restJson1
use smithy.framework#ValidationException

@title("Lambda backend for spiderman")

// Cross-origin resource sharing allows resources to be requested from external domains.
// Cors should be enabled for externally facing services and disabled for internally facing services.
// Enabling cors will modify the OpenAPI spec used to define your API Gateway endpoint.
// Uncomment the line below to enable cross-origin resource sharing
@cors()

@sigv4(name: "execute-api")
@restJson1
// Can only have 1 service, so look into resources to have journal + MC paths https://awslabs.github.io/smithy/2.0/spec/service-types.html#service-resources
//Smithy defines a resource as an entity with an identity that has a set of operations.
// it prob makes more sense to have a resource for Journal, but MC is a set of operations, really.
service IronSpider {
    version: "2018-05-10",
    operations: [Echo, Length, ServerStatus],
}

/// Echo operation that receives input from body.
@http(code: 200, method: "POST", uri: "/echo",)
operation Echo {
    input: EchoInput,
    output: EchoOutput,
    errors: [ValidationException, PalindromeException],
}

/// Length operation that receives input from path.
@readonly
@http(code: 200, method: "GET", uri: "/length/{string}",)
operation Length {
    input: LengthInput,
    output: LengthOutput,
    errors: [ValidationException, PalindromeException],
}

@readonly
@http(code: 200, method: "GET", uri: "/server/status")
operation ServerStatus {
    output: ServerStatusOutput,
    errors: [ValidationException],
}

intEnum Status {
    @enumValue(0)
    PENDING
    RUNNING = 16
    SHUTTING_DOWN = 32
    TERMINATED = 48
    STOPPING = 64
    STOPPED = 80
}

@output
structure ServerStatusOutput {
    
    status: Status
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


structure EchoInput {
    string: String,
}

structure EchoOutput {
    string: String,
}

structure LengthInput {
    @required
    @httpLabel
    string: String,
}

structure LengthOutput {
    length: Integer,
}

/// For some reason, this service does not like palindromes!
@httpError(400)
@error("client")
structure PalindromeException {
    message: String,
}
