import {Operation} from "@aws-smithy/server-common";
import {
    BadRequestError,
    CreateUserInput, CreateUserOutput,
    GenerateRegistrationOptionsServerInput,
    GenerateRegistrationOptionsServerOutput
} from "iron-spider-ssdk";
import {HandlerContext} from "../apigateway";
import jwt  from 'jsonwebtoken'

import {KeyPair} from "../accessors/SecretsManagerSecretKeyAccessor";
import {JWT_AUDIENCE, JWT_ISSUER} from "../constants/passkeyConst";
import {SecretKeyAccessor, UserAccessor} from "../accessors/AccessorInterfaces";
import processor from "../processors/PasskeyFlowProcessor";



export const CreateUserOperation: Operation<CreateUserInput, CreateUserOutput, HandlerContext> = async (
    input,
    context
) => {
    // check input fields are not null
    if(input.email == null || input.displayName == null) {
        throw new BadRequestError({message: "Missing fields in input"});
    }
    try {
        let results = await processor.createUser(input.email, input.displayName)
    }catch (e) {

    }


    return {}
}