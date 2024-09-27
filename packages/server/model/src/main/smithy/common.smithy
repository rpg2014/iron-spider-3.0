$version: "2"
namespace com.rpg2014.cloud.common

use smithy.framework#ValidationException
use com.rpg2014.cloud#NotFoundError
use com.rpg2014.cloud#BadRequestError

@mixin
operation ValidatedOperation {
    errors: [ValidationException, BadRequestError, NotFoundError]
}


@mixin
structure CommonHeaders {
    @httpHeader("Server-Timing")
    serverTiming: String
}