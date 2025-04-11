import { Operation } from "@aws-smithy/server-common";
import { ApproveOAuthInput, ApproveOAuthOutput, OAuthError, InternalServerError } from "iron-spider-ssdk";
import { getAuthorizationAccessor } from "src/accessors/AccessorFactory";
import { HandlerContext } from "src/model/common";
import { Logger, LogLevel } from "src/util";
import { ERROR_INVALID_CLIENT, ERROR_INVALID_REQUEST } from "./constants";
import { validateClient } from "./utils";

/**
 * Logic
 * 1. validate client id and redirect url
 * 2. validate scope contains openid + client has permissions to the other ones
 * check to see if user has already approved this client
 * 2.1 if user has already approved this client, update the auth with a new temp auth code.
 
 * 2.1 if code_challenge is present, save it in the authorization do i need code challenge method too?
 * 
 * 3. generate auth code
 * 4. return
 * @param input 
 * @param context 
 */
export const ApproveOAuth: Operation<ApproveOAuthInput, ApproveOAuthOutput, HandlerContext> = async (input, context) => {
  const logger = new Logger(LogLevel.INFO, "ApproveOAuth");
  logger.info("Starting operation", { clientId: input.client_id });

  const authorizationAccessor = getAuthorizationAccessor();
  
  // Validate client and redirect URI
  if (!input.client_id) {
    logger.error("Missing client ID");
    throw new OAuthError({ message: "Client ID is required", error: ERROR_INVALID_CLIENT, error_description: "Client ID is required" });
  }
  await validateClient(input.client_id, input.redirect_uri, logger);

  if (!context.userId || !input.client_id) {
    logger.error(`Missing required parameters - User ID: ${context.userId}, Client ID: ${input.client_id}`);
    throw new OAuthError({
      message: "User ID and Client ID are required",
      error: ERROR_INVALID_REQUEST,
      error_description: "User ID and Client ID are required",
    });
  }

  logger.info(`Checking for previous authorization for user: ${context.userId}`);
  let previousAuth = null;
  try {
    previousAuth = await authorizationAccessor.getAuthorizationForUserAndClient(context.userId, input.client_id);
    logger.info(`Previous authorization found: ${previousAuth?.authorizationId || "none"}`);
  } catch (error) {
    logger.warn(`Error getting previous authorization: ${error}`);
  }

  try {
    if (previousAuth && previousAuth.authorizationId) {
      logger.info(`Renewing authorization with ID: ${previousAuth.authorizationId}`);
      const newAuth = await authorizationAccessor.renewAuthorization({
        previousAuthId: previousAuth.authorizationId,
        code_challenge: input.code_challenge,
        userId: previousAuth.userId,
        code_challenge_method: input.code_challenge_method,
      });
      logger.info("Successfully generated new auth code");
      return {
        code: newAuth.authCode,
        redirect_uri: input.redirect_uri,
      };
    } else {
      logger.info("Creating new authorization");
      const auth = await authorizationAccessor.createAuthorization({
        clientId: input.client_id,
        userId: context.userId,
        scopes: input.scopes ? input.scopes : [],
        code_challenge: input.code_challenge,
        code_challenge_method: input.code_challenge_method,
      });
      logger.info("Successfully created new authorization");
      return {
        code: auth.authCode,
        redirect_uri: input.redirect_uri,
      };
    }
  } catch (error: any) {
    logger.error(`Error approving OAuth: ${error}`);
    throw new InternalServerError({ message: "Error approving OAuth: " + error?.message });
  }
};