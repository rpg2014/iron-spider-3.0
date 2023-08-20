import {Operation} from "@aws-smithy/server-common";
import {
    GenerateRegistrationOptionsServerInput,
    GenerateRegistrationOptionsServerOutput,
    ServerStatusOutput
} from "iron-spider-ssdk";
import {HandlerContext} from "../apigateway";


export const GenerateRegistrationOptionsOperation: Operation<GenerateRegistrationOptionsServerInput, GenerateRegistrationOptionsServerOutput, HandlerContext> = async (
    input,
    context
) => {
    return {};
}