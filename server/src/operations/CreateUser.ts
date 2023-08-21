import {Operation} from "@aws-smithy/server-common";
import {
    CreateUserInput, CreateUserOutput,
    GenerateRegistrationOptionsServerInput,
    GenerateRegistrationOptionsServerOutput
} from "iron-spider-ssdk";
import {HandlerContext} from "../apigateway";
import jwt  from 'jsonwebtoken'

import {KeyPair} from "../accessors/SecretsManagerSecretKeyAccessor";
import {JWT_AUDIENCE, JWT_ISSUER} from "../constants/passkeyConst";
import {SecretKeyAccessor} from "../accessors/AccessorInterfaces";



export const CreateUserOperation: Operation<CreateUserInput, CreateUserOutput, HandlerContext> = async (
    input,
    context
) => {

    // do some sort of robot check? captcha?
    const keyPair: KeyPair = await SecretKeyAccessor.getSecretKeyAccessor().getKey();
    // create verification code
    const verificationCode = jwt.sign({
        email: input.email,
        displayName: input.displayName,

    }, keyPair.privateKey, {
        expiresIn: '1h',
        issuer: JWT_ISSUER,
        algorithm: "RS256",
        audience: JWT_AUDIENCE,
    });
    // create user in db and save code


    // send email to user with magic link


    return {}
}