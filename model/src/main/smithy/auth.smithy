$version: "2"

namespace com.rpg2014.cloud

use smithy.framework#ValidationException

@http(code:200, method: "POST", uri: "/v1/registration/create")
operation CreateUser {
    input: CreateUserInput,
    output: CreateUserOutput,
    errors: [ValidationException, InternalServerError, NeedDomainAccessError]
}


structure CreateUserInput {
    @required
    displayName: String,// displayName
    @required
    email: String, //username
}

structure CreateUserOutput {
    @required
    success: Boolean,
    verificationCode: String,
}


@http(code: 200, method: "POST", uri: "/v1/registration/options")
operation GenerateRegistrationOptions {
    input: GenerateRegistrationOptionsInput,
    output: GenerateRegistrationOptionsOutput,
    errors: [ValidationException, InternalServerError, BadRequestError],
}
structure GenerateRegistrationOptionsInput {
    @required
    challenge: String,
}
structure GenerateRegistrationOptionsOutput {
    @httpPayload
    results: String
}

@http(code:200, method: "POST", uri: "/v1/registration/verification")
operation VerifyRegistration {
    input: VerifyRegistrationInput,
    output: VerifyRegistrationOutput,
    errors: [ValidationException, InternalServerError],
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

structure VerifyRegistrationOutput {
    @required
    verified: Boolean,
    @httpHeader("Set-Cookie")
    userCookie: String,
    userId: String,
}

 @http(code: 200, method: "GET", uri: "/v1/authentication/options")
 operation GenerateAuthenticationOptions {
    input: GenerateAuthenticationOptionsInput,
    output: GenerateAuthenticationOptionsOutput,
    errors: [InternalServerError, BadRequestError, ValidationException]
 }

structure GenerateAuthenticationOptionsInput {
    @httpQuery("userId")
     userId: String,
     @httpQuery("email")
     email: String
}

structure GenerateAuthenticationOptionsOutput {
    @required
    authenticationResponseJSON: String,
    @required
    userId: String
}

@http(code: 200, method: "POST", uri: "/v1/authentication/verification")
operation VerifyAuthentication {
    input: VerifyAuthenticationInput,
    output: VerifyAuthenticationOutput,
    errors: [InternalServerError, BadRequestError, ValidationException]
}

structure VerifyAuthenticationInput {
    @required
    verificationResponse: String
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
structure VerifyAuthenticationOutput {
    @required
    verified: Boolean,
    @httpHeader("Set-Cookie")
    userCookie: String,
    userId: String,
    userData: UserData
}
