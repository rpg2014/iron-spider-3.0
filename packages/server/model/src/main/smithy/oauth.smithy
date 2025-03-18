$version: "2"

namespace com.rpg2014.cloud.oauth

use smithy.framework#ValidationException
use com.rpg2014.cloud.common#CommonErrors
use com.rpg2014.cloud.common#CommonHeaders

@http(method: "GET", uri: "/v1/oauth/details")
@readonly
operation GetOAuthDetails with [CommonErrors] {
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
structure GetOAuthDetailsOutput  with [CommonHeaders] {
    @required
    clientName: String,
    // permissions: String,
}

@http(method: "POST", uri: "/v1/oauth/approve")
operation ApproveOAuth with [CommonErrors] {
    input: ApproveOAuthInput
    output: ApproveOAuthOutput
    errors: [OAuthError]
}


@input
structure ApproveOAuthInput {
    @required
    client_id: String
    @required
    redirect_uri: String,

    @required
    scopes: StringList

    @documentation("Used for PKCE verification")  
    code_challenge: String
    code_challenge_method: String

    id_token_hint: String,
}

list StringList {
    member: String
}

@output
structure ApproveOAuthOutput with [CommonHeaders] {
    @required
    code: String
    @required
    redirect_uri: String
}

@http(method: "POST", uri: "/v1/oauth/tokens")
@optionalAuth // Is this needed?
operation GetOAuthTokens with [CommonErrors] {
    input: GetOAuthTokensInput
    output: GetOAuthTokensOutput
    errors: [OAuthError]
}
@mediaType("application/x-www-form-urlencoded")
string OAuthTokenInput
@input
structure GetOAuthTokensInput {
    @required
    @httpPayload
    @documentation("application/x-www-form-urlencoded request body")
    body: OAuthTokenInput
}
@output
structure GetOAuthTokensOutput with [CommonHeaders] {
    @required
    access_token: String,
    @required
    @documentation("The type of token returned. At this time, this field always has the value Bearer")
    token_type: String,
    @required
    @documentation("The lifetime in seconds of the access token")
    expires_in: Integer,
    @required
    refresh_token: String,
    @required
    id_token: String,
    scope: String
}

@httpError(400)
@error("client")
structure OAuthError {
    message: String
    error: String,
    error_description: String
}

@http(method: "GET", uri: "/.well-known/openid-configuration") 
operation GetOIDCDiscovery with [CommonErrors] {
    output: GetOIDCDiscoveryOutput
}

@output
structure GetOIDCDiscoveryOutput with [CommonHeaders] {
    /// URL using the https scheme with no query or fragment component that the OP asserts as its Issuer Identifier.
    /// If Issuer discovery is supported, this value MUST be identical to the issuer value returned by WebFinger.
    /// This also MUST be identical to the iss Claim value in ID Tokens issued from this Issuer.
    @required
    issuer: String,

    /// URL of the OP's OAuth 2.0 Authorization Endpoint.
    @required
    authorization_endpoint: String,

    /// URL of the OP's OAuth 2.0 Token Endpoint.
    /// This is REQUIRED unless only the Implicit Flow is used.
    token_endpoint: String,

    /// URL of the OP's UserInfo Endpoint.
    /// This URL MUST use the https scheme and MAY contain port, path, and query parameter components.
    userinfo_endpoint: String,

    /// URL of the OP's JSON Web Key Set (JWK) document.
    /// This contains the signing key(s) the RP uses to validate signatures from the OP.
    @required
    jwks_uri: String,

    /// URL of the OP's Dynamic Client Registration Endpoint.
    registration_endpoint: String,

    /// JSON array containing a list of the OAuth 2.0 scope values that this server supports.
    /// The server MUST support the openid scope value.
    scopes_supported: ScopesList,

    /// JSON array containing a list of the OAuth 2.0 response_type values that this OP supports.
    /// Dynamic OpenID Providers MUST support the code, id_token, and the token id_token Response Type values.
    @required
    response_types_supported: ResponseTypesList,

    /// JSON array containing a list of the OAuth 2.0 response_mode values that this OP supports.
    /// If omitted, the default for Dynamic OpenID Providers is ["query", "fragment"].
    response_modes_supported: ResponseModesList,

    /// JSON array containing a list of the OAuth 2.0 Grant Type values that this OP supports.
    /// If omitted, the default value is ["authorization_code", "implicit"].
    grant_types_supported: GrantTypesList,

    /// JSON array containing a list of the Authentication Context Class References that this OP supports.
    acr_values_supported: AcrValuesList,

    /// JSON array containing a list of the Subject Identifier types that this OP supports.
    /// Valid types include pairwise and public.
    @required
    subject_types_supported: SubjectTypesList,

    /// JSON array containing a list of the JWS signing algorithms (alg values) supported by the OP for the ID Token.
    /// The algorithm RS256 MUST be included.
    @required
    id_token_signing_alg_values_supported: JwsAlgorithmsList,

    /// JSON array containing a list of the JWE encryption algorithms (alg values) supported by the OP for the ID Token.
    id_token_encryption_alg_values_supported: JweAlgorithmsList,

    /// JSON array containing a list of the JWE encryption algorithms (enc values) supported by the OP for the ID Token.
    id_token_encryption_enc_values_supported: JweEncryptionList,

    /// JSON array containing a list of the JWS signing algorithms (alg values) supported by the UserInfo Endpoint.
    userinfo_signing_alg_values_supported: JwsAlgorithmsList,

    /// JSON array containing a list of the JWE encryption algorithms (alg values) supported by the UserInfo Endpoint.
    userinfo_encryption_alg_values_supported: JweAlgorithmsList,

    /// JSON array containing a list of the JWE encryption algorithms (enc values) supported by the UserInfo Endpoint.
    userinfo_encryption_enc_values_supported: JweEncryptionList,

    /// JSON array containing a list of the JWS signing algorithms (alg values) supported by the OP for Request Objects.
    /// Servers SHOULD support none and RS256.
    request_object_signing_alg_values_supported: JwsAlgorithmsList,

    /// JSON array containing a list of the JWE encryption algorithms (alg values) supported by the OP for Request Objects.
    request_object_encryption_alg_values_supported: JweAlgorithmsList,

    /// JSON array containing a list of the JWE encryption algorithms (enc values) supported by the OP for Request Objects.
    request_object_encryption_enc_values_supported: JweEncryptionList,

    /// JSON array containing a list of Client Authentication methods supported by this Token Endpoint.
    /// If omitted, the default is client_secret_basic.
    token_endpoint_auth_methods_supported: AuthMethodsList,

    /// JSON array containing a list of the JWS signing algorithms (alg values) supported by the Token Endpoint.
    /// Servers SHOULD support RS256. The value none MUST NOT be used.
    token_endpoint_auth_signing_alg_values_supported: JwsAlgorithmsList,

    /// JSON array containing a list of the display parameter values that the OpenID Provider supports.
    display_values_supported: DisplayValuesList,

    /// JSON array containing a list of the Claim Types that the OpenID Provider supports.
    /// If omitted, the implementation supports only normal Claims.
    claim_types_supported: ClaimTypesList,

    /// JSON array containing a list of the Claim Names of the Claims that the OpenID Provider MAY be able to supply values for.
    claims_supported: ClaimsList,

    /// URL of a page containing human-readable information that developers might want or need to know when using the OpenID Provider.
    service_documentation: String,

    /// Languages and scripts supported for values in Claims being returned, represented as a JSON array of BCP47 language tag values.
    claims_locales_supported: LanguageTagsList,

    /// Languages and scripts supported for the user interface, represented as a JSON array of BCP47 language tag values.
    ui_locales_supported: LanguageTagsList,

    /// Boolean value specifying whether the OP supports use of the claims parameter, with true indicating support.
    /// If omitted, the default value is false.
    claims_parameter_supported: Boolean,

    /// Boolean value specifying whether the OP supports use of the request parameter, with true indicating support.
    /// If omitted, the default value is false.
    request_parameter_supported: Boolean,

    /// Boolean value specifying whether the OP supports use of the request_uri parameter, with true indicating support.
    /// If omitted, the default value is true.
    request_uri_parameter_supported: Boolean,

    /// Boolean value specifying whether the OP requires any request_uri values used to be pre-registered.
    /// If omitted, the default value is false.
    require_request_uri_registration: Boolean,

    /// URL that the OpenID Provider provides to the person registering the Client to read about the OP's requirements.
    op_policy_uri: String,

    /// URL that the OpenID Provider provides to the person registering the Client to read about OpenID Provider's terms of service.
    op_tos_uri: String,
}

/// List of OAuth 2.0 scope values supported by this server
@documentation("List of OAuth 2.0 scope values supported by this server")
list ScopesList {
    member: String
}

/// List of OAuth 2.0 response_type values supported by this OP
@documentation("List of OAuth 2.0 response_type values supported by this OP")
list ResponseTypesList {
    member: String
}

/// List of OAuth 2.0 response_mode values supported by this OP
@documentation("List of OAuth 2.0 response_mode values supported by this OP")
list ResponseModesList {
    member: String
}

/// List of OAuth 2.0 Grant Type values supported by this OP
@documentation("List of OAuth 2.0 Grant Type values supported by this OP")
list GrantTypesList {
    member: String
}

/// List of Authentication Context Class References supported by this OP
@documentation("List of Authentication Context Class References supported by this OP")
list AcrValuesList {
    member: String
}

/// List of Subject Identifier types supported by this OP
@documentation("List of Subject Identifier types supported by this OP")
list SubjectTypesList {
    member: String
}

/// List of JWS signing algorithms supported by the OP
@documentation("List of JWS signing algorithms supported by the OP")
list JwsAlgorithmsList {
    member: String
}

/// List of JWE encryption algorithms supported by the OP
@documentation("List of JWE encryption algorithms supported by the OP")
list JweAlgorithmsList {
    member: String
}

/// List of JWE encryption methods supported by the OP
@documentation("List of JWE encryption methods supported by the OP")
list JweEncryptionList {
    member: String
}

/// List of Client Authentication methods supported by the Token Endpoint
@documentation("List of Client Authentication methods supported by the Token Endpoint")
list AuthMethodsList {
    member: String
}

/// List of display parameter values supported by this OpenID Provider
@documentation("List of display parameter values supported by this OpenID Provider")
list DisplayValuesList {
    member: String
}

/// List of Claim Types supported by this OpenID Provider
@documentation("List of Claim Types supported by this OpenID Provider")
list ClaimTypesList {
    member: String
}

/// List of Claim Names that the OpenID Provider may be able to supply values for
@documentation("List of Claim Names that the OpenID Provider may be able to supply values for")
list ClaimsList {
    member: String
}

/// Languages and scripts represented as a list of BCP47 language tag values
@documentation("Languages and scripts represented as a list of BCP47 language tag values")
list LanguageTagsList {
    member: String
}