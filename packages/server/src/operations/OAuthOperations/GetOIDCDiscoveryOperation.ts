import { Operation } from "@aws-smithy/server-common";
import { GetOIDCDiscoveryServerInput, GetOIDCDiscoveryOutput } from "iron-spider-ssdk";
import { HandlerContext } from "src/model/common";
import { Logger, LogLevel } from "src/util";

/**
 * Returns OpenID Connect discovery information
 * This operation provides the necessary endpoints and configuration
 * for OpenID Connect clients to discover and interact with the service
 */
export const GetOIDCDiscoveryOperation: Operation<GetOIDCDiscoveryServerInput, GetOIDCDiscoveryOutput, HandlerContext> = async (input, context) => {
    const logger = new Logger(LogLevel.INFO, "GetOIDCDiscoveryOperation");
    logger.info("Generating OIDC discovery document");
  
    const authDomain = "https://auth.parkergiven.com";
    const apiDomain = "https://api.parkergiven.com";
  
    const discoveryDocument = {
      issuer: authDomain,
      authorization_endpoint: `${authDomain}/authorize`,
      jwks_uri: `${apiDomain}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      token_endpoint: `${apiDomain}/v1/oauth/tokens`,
      id_token_signing_alg_values_supported: ["RS256"],
      claims_supported: ["openid", "profile"],
      request_uri_parameter_supported: false,
      userinfo_endpoint: `${apiDomain}/v1/userInfo`,
    } satisfies GetOIDCDiscoveryOutput;
  
    logger.info("Returning OIDC discovery document");
    return discoveryDocument;
  };
  