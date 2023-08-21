import {Operation} from "@aws-smithy/server-common";
import {
    GenerateRegistrationOptionsServerInput,
    GenerateRegistrationOptionsServerOutput,
    ServerStatusOutput
} from "iron-spider-ssdk";
import {HandlerContext} from "../apigateway";
import { generateAuthenticationOptions, generateRegistrationOptions } from "@simplewebauthn/server/./dist";


export const GenerateRegistrationOptionsOperation: Operation<GenerateRegistrationOptionsServerInput, GenerateRegistrationOptionsServerOutput, HandlerContext> = async (
    input,
    context
) => {
    
    return generateRegistrationOptions({
        rpID: rpId,
        rpName: rpName,
        uesrID: "id",
        userName: "userName"
    });
}