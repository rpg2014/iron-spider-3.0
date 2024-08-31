$version: "2"
namespace com.rpg2014.cloud.common

use smithy.framework#ValidationException

@mixin
operation ValidatedOperation {
    errors: [ValidationException]
}


@mixin
structure CommonHeaders {
    @httpHeader("Server-Timing")
    serverTiming: String
}