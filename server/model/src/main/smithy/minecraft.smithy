$version: "2"

namespace com.rpg2014.cloud

use com.rpg2014.cloud#InternalServerError
use smithy.framework#ValidationException


@readonly
@http(code: 200, method: "GET", uri: "/server/status")
operation ServerStatus {
    output: ServerStatusOutput,
    errors: [ValidationException, InternalServerError],
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
    errors: [ValidationException, InternalServerError],
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

structure ServerStatusOutput  {
    @required
    status: Status
}
structure ServerDetailsOutput {
    domainName: String,
}

structure StartServerOutput {
    serverStarted: Boolean,
}

structure StopServerOutput {
    serverStopping: Boolean,
}
