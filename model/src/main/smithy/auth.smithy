$version: "2"

namespace com.rpg2014.cloud

use smithy.framework#ValidationException

@http(code:200, method: "POST", uri: "/v1/registration/create")
operation CreateUser {
    input: CreateUserInput,
    output: CreateUserOutput,
    errors: [ValidationException, InternalServerError]
}


structure CreateUserInput {
    @required
    displayName: String,// displayName
    @required
    email: String, //username
}

structure CreateUserOutput {
    success: Boolean
}


@http(code: 200, method: "POST", uri: "/v1/registration/options")
operation GenerateRegistrationOptions {
    input: GenerateRegistrationOptionsInput,
    output: GenerateRegistrationOptionsOutput,
    errors: [ValidationException, InternalServerError, BadRequestError],
}
structure GenerateRegistrationOptionsInput {
    @required
    email: String, //email
    @required
    userDisplayName: String, //username
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
    @httpPayload
    body: String,
}

structure VerifyRegistrationOutput {
    verified: Boolean
}

// @http(code: 200, method: "POST", uri: "/v1/registration/options)
// operation GenerateAuthenticationOptions {

// }
