import { Operation } from "@aws-smithy/server-common";
import { OAuthLogoutInput, OAuthLogoutOutput, OAuthError, InternalServerError } from "iron-spider-ssdk";
import { getOIDCClientAccessor, getAuthorizationAccessor, getTokenAccessor } from "../../accessors/AccessorFactory";
import { HandlerContext } from "src/model/common";
import { Logger, LogLevel } from "src/util";
import { ERROR_INVALID_CLIENT, ERROR_INVALID_REQUEST } from "./constants";

export const OAuthLogoutOperation: Operation<OAuthLogoutInput, OAuthLogoutOutput, HandlerContext> = async (input, context) => {
    const logger = new Logger(LogLevel.INFO, "OAuthLogoutOperation");
    
    if (!input.clientId || !input.postLogoutRedirectUri || !input.idTokenHint) {
        logger.error("Missing required parameters");
        throw new OAuthError({
            message: "Missing required parameters",
            error: ERROR_INVALID_REQUEST,
            error_description: "client_id, post_logout_redirect_uri, and id_token_hint are required",
        });
    }

    // Get client to validate client_id
    const oidcClientAccessor = getOIDCClientAccessor();
    const client = await oidcClientAccessor.getClient(input.clientId);
    if (!client) {
        logger.error(`Client not found: ${input.clientId}`);
        throw new OAuthError({
            message: "Client not found",
            error: ERROR_INVALID_CLIENT,
            error_description: "Client not found",
        });
    }

    try {
        const tokenAccessor = getTokenAccessor();
        const authorizationAccessor = getAuthorizationAccessor();
        logger.info(`Getting authorization for client_id: ${input.clientId} and id_token_hint: ${input.idTokenHint}`)
        // Get the token to find its session ID
        const token = await tokenAccessor.getToken(input.idTokenHint);
        if (!token || !token.sessionId || !token.authorizationId || !token.userId) {
            logger.error("Invalid or missing token");
            throw new OAuthError({
                message: "Invalid token",
                error: ERROR_INVALID_REQUEST,
                error_description: "Invalid token",
            });
        }

        // Delete all tokens with the same session ID from the authorization
        logger.info("Deleting tokens with session ID", { sessionId: token.sessionId });
        const deletedTokens = await authorizationAccessor.removeTokensFromAuthorizationBySessionId(
            token.authorizationId,
            token.sessionId,
            token.userId
        );

        // Delete the tokens from the token database
        await Promise.all(deletedTokens.map(async (tokenId) => {
            await tokenAccessor.deleteToken(tokenId);
        }));

        logger.info("Successfully deleted tokens", {
            sessionId: token.sessionId,
            deletedTokenCount: deletedTokens.length,
        });

        return {
            redirect_uri: input.postLogoutRedirectUri,
            state: input.state
        };
    } catch (error: any) {
        logger.error("Error during logout:", error);
        throw new InternalServerError({ message: "Error during logout: " + error?.message });
    }
};