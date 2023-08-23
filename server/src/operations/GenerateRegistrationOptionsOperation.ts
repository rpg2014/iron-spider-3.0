import {Operation} from "@aws-smithy/server-common";
import {
    GenerateRegistrationOptionsServerInput,
    GenerateRegistrationOptionsServerOutput, InternalServerError,
    BadRequestError,
    ServerStatusOutput
} from "iron-spider-ssdk";
import {HandlerContext} from "../apigateway";
import jwt, {Jwt, JwtPayload} from "jsonwebtoken";
import {SecretKeyAccessor} from "../accessors/AccessorInterfaces";
import {JWT_AUDIENCE, JWT_ISSUER} from "../constants/passkeyConst";


export const GenerateRegistrationOptionsOperation: Operation<GenerateRegistrationOptionsServerInput, GenerateRegistrationOptionsServerOutput, HandlerContext> = async (
    input,
    context
) => {
    // unpack verification code,
    // verify
    const keyPair = await SecretKeyAccessor.getSecretKeyAccessor().getKey();
    if(!input.challenge){
        throw new BadRequestError({message: "no challenge returned"})
    }
    try {
        const decoded = jwt.verify(input.challenge, keyPair.publicKey, {
            algorithms: ['RS256'],
            audience: JWT_AUDIENCE,
            issuer: JWT_ISSUER,
            clockTolerance: 1,
            maxAge: "1h"
        })
    }catch (e: any) {
        throw new BadRequestError({message: "Error " + e.message})
    }
    // get display name and

    return {};
}