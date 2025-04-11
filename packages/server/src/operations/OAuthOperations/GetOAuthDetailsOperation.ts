import { Operation } from "@aws-smithy/server-common";
import { GetOAuthDetailsInput, GetOAuthDetailsOutput, NotFoundError, OAuthError } from "iron-spider-ssdk";
import { HandlerContext } from "src/model/common";
import { Logger, LogLevel } from "src/util";
import { ERROR_INVALID_CLIENT, ERROR_INVALID_REQUEST } from "./constants";
import { validateClient } from "./utils";

/**
 * Retrieves OAuth client details after validating client ID and redirect URI
 *
 * This operation:
 * 1. Validates that the client exists
 * 2. Validates that the redirect URI is registered for the client (if provided)
 * 3. Returns the client name for display to the user
 *
 * @param input The input containing clientId and optional redirectUri
 * @param context The handler context
 * @returns Client name for display to the user
 * @throws NotFoundError if client or redirect URI is not found
 */
export const GetOAuthDetails: Operation<GetOAuthDetailsInput, GetOAuthDetailsOutput, HandlerContext> = async (input, context) => {
  const logger = new Logger(LogLevel.INFO, "GetOAuthDetails");
  logger.info(`Got Input: ${JSON.stringify(input)}`);

  try {
    if (!input.clientId) {
      logger.error("Missing client ID");
      throw new NotFoundError({ message: "Client ID is required" });
    }

    // Use the validateClient function but handle NotFoundError differently
    const client = await validateClient(input.clientId, input.redirectUri, logger);

    logger.info(`Returning client details for: ${client.clientName}`);
    return {
      clientName: client.clientName,
    };
  } catch (error) {
    // Convert OAuthError to NotFoundError for backward compatibility, thrown by the new validateClient method
    // this api technically isn't part of oauth, and is just used by my ui.
    if (error instanceof OAuthError) {
      if (error.error === ERROR_INVALID_CLIENT) {
        throw new NotFoundError({ message: "Client Configuration not found" });
      } else if (error.error === ERROR_INVALID_REQUEST) {
        throw new NotFoundError({ message: "Redirect URI not found" });
      }
    }
    throw error;
  }
};