$version: "2"

namespace com.rpg2014.cloud

use com.rpg2014.cloud.common#ValidatedOperation
use com.rpg2014.cloud.common#CommonHeaders
use com.rpg2014.cloud#InternalServerError
use com.rpg2014.cloud#BadRequestError
use smithy.framework#ValidationException


@readonly
@http(code: 200, method: "GET", uri: "/server/status")
operation ServerStatus with [ValidatedOperation] {
    output: ServerStatusOutput ,
    errors: [InternalServerError],
}

@readonly
@http(code: 200, method: "GET", uri: "/server/details")
operation ServerDetails {
    output: ServerDetailsOutput,
    errors: [ValidationException, InternalServerError]
}


@http(code: 200, method: "POST", uri: "/server/start")
operation StartServer {
    output: StartServerOutput,
    errors: [ValidationException, InternalServerError, BadRequestError],
}



@http(code:200, method: "POST", uri: "/server/stop")
operation StopServer {
    output: StopServerOutput,
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

structure ServerStatusOutput with [CommonHeaders]  {
    @required
    status: Status
}
structure ServerDetailsOutput with [CommonHeaders] {
    domainName: String,
}

structure StartServerOutput with [CommonHeaders] {
    serverStarted: Boolean,
}

structure StopServerOutput with [CommonHeaders] {
    serverStopping: Boolean,
}
