$version: "2"
namespace com.rpg2014.cloud.common

use smithy.framework#ValidationException
use com.rpg2014.cloud#NotFoundError
use com.rpg2014.cloud#BadRequestError
use com.rpg2014.cloud#InternalServerError

@mixin
operation CommonErrors {
    errors: [ValidationException, BadRequestError, NotFoundError, InternalServerError]
}


@mixin
structure CommonHeaders {
    @httpHeader("Server-Timing")
    serverTiming: String
}