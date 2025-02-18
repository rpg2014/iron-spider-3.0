import { Operation } from "@aws-smithy/server-common";
import { GetOAuthDetailsInput, GetOAuthDetailsOutput } from "iron-spider-ssdk";
import { HandlerContext } from "src/model/common";
import { Logger, LogLevel } from "src/util";



export const GetOAuthDetails: Operation<GetOAuthDetailsInput, GetOAuthDetailsOutput, HandlerContext> = async (input, context) => {
    const logger = new Logger(LogLevel.INFO,"GetOAuthDetails");
    logger.info(`Got Input: ${JSON.stringify(input)}`)
    
    return {
        clientName: "Test Client",
        permissions: "Test permissions"
    } satisfies GetOAuthDetailsOutput
}