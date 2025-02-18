$version: "2"

namespace com.rpg2014.cloud.oauth

use smithy.framework#ValidationException
use com.rpg2014.cloud.common#ValidatedOperation
use com.rpg2014.cloud.common#CommonHeaders

@http(method: "GET", uri: "/v1/oauth/details")
operation GetOAuthDetails with [ValidatedOperation] {
    input: GetOAuthDetailsInput
    output: GetOAuthDetailsOutput
    
}
@input
structure GetOAuthDetailsInput {
    @required
    @httpQuery("client_id")
    clientId: String,
    @required
    @httpQuery("redirect_uri")
    redirectUri: String,

}

@output
structure GetOAuthDetailsOutput {
    @required
    clientName: String,
    permissions: String,
}