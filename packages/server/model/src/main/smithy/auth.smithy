$version: "2"

namespace com.rpg2014.cloud

use smithy.framework#ValidationException
use com.rpg2014.cloud.common#CommonErrors
use com.rpg2014.cloud.common#CommonHeaders

@http(code:200, method: "POST", uri: "/v1/registration/create")
@optionalAuth
operation CreateUser {
    input: CreateUserInput,
    output: CreateUserOutput,
    errors: [ValidationException, InternalServerError, NeedDomainAccessError]
}
@http(code: 200, method: "POST", uri: "/v1/registration/options")
@optionalAuth
operation GenerateRegistrationOptions {
    input: GenerateRegistrationOptionsInput,
    output: GenerateRegistrationOptionsOutput,
    errors: [ValidationException, InternalServerError, BadRequestError],
}
@http(code:200, method: "POST", uri: "/v1/registration/verification")
@optionalAuth
operation VerifyRegistration {
    input: VerifyRegistrationInput,
    output: VerifyRegistrationOutput,
    errors: [ValidationException, InternalServerError],
}
 @http(code: 200, method: "GET", uri: "/v1/authentication/options")
 @readonly
 @optionalAuth
 operation GenerateAuthenticationOptions {
    input: GenerateAuthenticationOptionsInput,
    output: GenerateAuthenticationOptionsOutput,
    errors: [InternalServerError, BadRequestError, ValidationException]
 }
@http(code: 200, method: "POST", uri: "/v1/authentication/verification")
@optionalAuth
operation VerifyAuthentication {
    input: VerifyAuthenticationInput,
    output: VerifyAuthenticationOutput,
    errors: [InternalServerError, BadRequestError, ValidationException]
}
@http(code: 200, method: "GET", uri: "/v1/userInfo")
@optionalAuth
@readonly
operation UserInfo {
    output: UserInfoOutput,
    errors: [InternalServerError, BadRequestError, ValidationException]
}

@http(code: 200, method: "POST", uri: "/v1/logout")
operation Logout {
    output: LogoutOutput,
    errors: [InternalServerError, BadRequestError, ValidationException]
}

@http(code: 200, method: "GET", uri: "/v1/jwks")
@readonly
operation GetPublicKeys {
    output: GetPublicKeysOutput
    errors: [InternalServerError, BadRequestError, ValidationException]
}

@readonly
@http(method: "GET", uri: "/.well-known/jwks.json")
operation GetJwks  with [CommonErrors] {
    output: GetJwksOutput
}



structure CreateUserInput {
    @required
    displayName: String,// displayName
    @required
    email: String, //username
}

structure CreateUserOutput  with [CommonHeaders] {
    @required
    success: Boolean,
}



structure GenerateRegistrationOptionsInput {
    @required
    challenge: String,
}
structure GenerateRegistrationOptionsOutput with [CommonHeaders] {
    @httpPayload
    results: String
}



structure VerifyRegistrationInput {
    @required
    userToken: String,
    @required
    transports: TransportsList,
    @required
    verficationResponse: String
}

list TransportsList {
    member: String
}

structure VerifyRegistrationOutput with [CommonHeaders] {
    @required
    verified: Boolean,
    @httpHeader("Set-Cookie")
    userCookie: String,
    userId: String,
}


structure GenerateAuthenticationOptionsInput {
    @httpQuery("userId")
     userId: String,
     @httpQuery("email")
     email: String
}

structure GenerateAuthenticationOptionsOutput with [CommonHeaders] {
    @required
    authenticationResponseJSON: String,
    @required
    userId: String
}



structure VerifyAuthenticationInput {
    @required
    authenticationResponse: String
    @required
    userId: String
}
list SiteAccessList {
    member: String
}
structure UserData {
    @required
    displayName: String
    @required
    siteAccess: SiteAccessList,
    @required
    numberOfCreds: Integer
}
structure VerifyAuthenticationOutput with [CommonHeaders] {
    @required
    verified: Boolean,
    @httpHeader("Set-Cookie")
    userCookie: String,
    userId: String,
    userData: UserData
}
structure UserInfoOutput with [CommonHeaders] {
    @required
    verified: Boolean,
    userId: String,
    displayName: String,
    siteAccess: SiteAccessList,
    apiAccess: SiteAccessList,
    credentials: SiteAccessList,
    tokenExpiry: Timestamp,
}

structure LogoutOutput with [CommonHeaders] {
    @httpHeader("Set-Cookie")
    userCookie: String,
}


structure GetPublicKeysOutput with [CommonHeaders] {
    @required
    keys: KeyList
}
list KeyList {
    member: String
}

structure GetJwksOutput with [CommonHeaders] {
    @required
    keys: JwksKeyList
}
list JwksKeyList {
    member: JwksKey
}
structure JwksKey {
    @required
    kty: String
    @required
    use: String
    @required
    kid: String,
    @required
    n: String,
    @required
    e: String,
    @required
    alg: String,
}
