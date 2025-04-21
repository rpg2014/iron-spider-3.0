import { event } from "./model/models";
import { generateAllow, generateDeny } from "./utils";
import { AUTH_CONFIG, OPERATION_CONFIG } from "./config/authConfig";
import { AuthenticationResult, AuthenticationService } from "./services/AuthenticationService";

const authService = new AuthenticationService();
export const authHandler = async (event: event, context) => {
    console.log(`[AuthHandler] Received request for operation: ${event.requestContext.operationName}, path: ${event.path}, method: ${event.httpMethod}`);
    console.log(`[AuthHandler] Request id: ${JSON.stringify(event.requestContext.requestId)}, Extended RequestId: ${event.requestContext.extendedRequestId}`);
    console.debug(`[AuthHandler] Request: ${JSON.stringify(event)}`);
    const v1Result = await authHandlerV1(event, context);
    const v2Result = await authHandlerV2(event, context);
    console.log(`[AuthHandler] V1 result: ${JSON.stringify(v1Result)}`)
    console.log(`[AuthHandler] V2 result: ${JSON.stringify(v2Result)}`);
    // check shadow mode
    if (!v1Result.context) v1Result.context = {};
    if(JSON.stringify(v1Result) === JSON.stringify(v2Result)) {
        console.log(`[AuthHandler] V1 and V2 results are the same`)
        // emit cloudwatch metric
        v1Result.context['authV2MigrationShadowMode'] = 'success'
    } else {
        console.log(`[AuthHandler] V1 and V2 results are different`)
        v1Result.context['authV2MigrationShadowMode'] = 'failure'
    }
    // todo remove v1 stuff
    // if operation take client basic or bearer auth auth, return v2 result
    if (event.headers && event.headers['Authorization'] && event.headers['Authorization'].startsWith('Basic')) {
        console.log(`[AuthHandler] Operation takes client basic auth, returning V2 result`);
        return v2Result;
    }
    console.log(`[AuthHandler] Returning V1 result: ${JSON.stringify(v1Result)}`)
    return v1Result;
};


const authHandlerV2 = async (event: event, context) => {
    console.log(`[AuthHandlerV2] Received request for operation: ${event.requestContext.operationName}`);
    const operationName = event.requestContext.operationName;
    // Get operation config
    const operationConfig = OPERATION_CONFIG[operationName];
    
    // If no config exists, deny access
    if (!operationConfig) {
        console.warn(`[AuthHandlerV2] No operation config found for: ${operationName}`);
        return generateDeny("unknown", event.methodArn, {
            message: "Operation not configured"
        });
    }

    // Check if spider-access-token is required
    const spiderToken = event.headers["spider-access-token"];
    if (!spiderToken && !operationConfig.doNotRequireSpiderAccessToken) {
        console.warn(`[AuthHandlerV2] No spider-access-token provided for operation: ${operationName}`);
        return generateDeny("unknown", event.methodArn, {
            message: "Missing spider-access-token"
        });
    } else {
        console.log(`[AuthHandlerV2] spider-access-token provided for operation: ${operationName}, or not required: ${operationConfig.doNotRequireSpiderAccessToken}`);
    }

    // Get available auth mechanisms
    const mechanisms = Array.isArray(operationConfig.mechanism) 
        ? operationConfig.mechanism 
        : [operationConfig.mechanism];
    
    // sort mechanisms so that we attempt cookie and bearer token first, then the rest, with cognito last
    mechanisms.sort((a, b) => {
        if (a === "cookie" || a === "bearer") return -1;
        if (b === "cookie" || b === "bearer") return 1;
        if (a === "cognito") return 1;
        if (b === "cognito") return -1;
        return 0;
    });
    console.log(`[AuthHandlerV2] Available auth mechanisms for operation: ${operationName}: ${mechanisms.join(", ")}`);
    // Try each auth mechanism
    for (const mechanism of mechanisms) {
        let authResult: AuthenticationResult;

        switch (mechanism) {
            case 'public':
                console.log(`[AuthHandlerV2] Public access granted for operation: ${operationName}`);
                return generateAllow("public", event.methodArn);

            case 'cookie':
                console.log(`[AuthHandlerV2] Attempting cookie authentication for operation: ${operationName}`);
                const cookieString = event.headers["cookie"] ?? event.headers["Cookie"];
                if (cookieString) {
                    authResult = await authService.authenticateByCookie(cookieString);
                    if (authResult.isAuthenticated) {
                        console.log(`[AuthHandlerV2] Cookie authentication successful for user: ${authResult.userId}`);
                        return generateAllow(authResult.userId || "unknown", event.methodArn, {
                            userId: authResult.userId,
                            displayName: authResult.displayName,
                            siteAccess: authResult.siteAccess?.join(","),
                            apiAccess: authResult.apiAccess?.join(","),
                            tokenExpiry: authResult.tokenExpiry?.toString()
                        });
                    }
                }
                break;

            

            case 'client_secret_basic_auth':
                console.log(`[AuthHandlerV2] Attempting oauth client basic authentication for operation: ${operationName}`);
                // print headers
                console.log(`[AuthHandlerV2] Headers: ${JSON.stringify(event.headers)}`);
                // normalize headers to lower case
                const basicAuthToken = event.headers["authorization"]?.split(" ")[1] || event.headers["Authorization"]?.split(" ")[1];
                if (basicAuthToken) {
                    console.log(`[AuthHandlerV2] Found Basic Auth Token`)
                    const decodedToken = Buffer.from(basicAuthToken, "base64").toString("utf-8");
                    const [clientId, clientSecret] = decodedToken.split(":");
                    console.log(`[AuthHandlerV2] Attempting authentication for client id: ${clientId}`)
                    authResult = await authService.authenticateByClientIdAndSecret(clientId, clientSecret);
                    if (authResult.isAuthenticated) {
                        console.log(`[AuthHandlerV2] Client secret authentication successful for client: ${authResult.displayName}`);
                        return generateAllow(authResult.oauth?.clientId || "client", event.methodArn, {
                            userId: authResult.oauth?.clientId,
                            displayName: authResult.displayName,
                            oauth: JSON.stringify(authResult.oauth)
                        });
                    }
                }
                break;

            case 'bearer':
                console.log(`[AuthHandlerV2] Attempting bearer token authentication for operation: ${operationName}`);
                // normalize headers to lower case
                const bearerToken = event.headers["authorization"]?.split(" ")[1] || event.headers["Authorization"]?.split(" ")[1];
                if (bearerToken) {
                    console.log(`[AuthHandlerV2] Found Bearer Token`)
                    authResult = await authService.authenticateByBearerToken(bearerToken);
                    if (authResult.isAuthenticated) {
                        console.log(`[AuthHandlerV2] Bearer token authentication successful for user: ${authResult.userId}`);
                        return generateAllow(authResult.userId || "bearer_user", event.methodArn, {
                            userId: authResult.userId,
                            displayName: authResult.displayName,
                            apiAccess: authResult.apiAccess?.join(", "),
                            siteAccess: authResult.siteAccess?.join(", "),
                            tokenExpiry: authResult.tokenExpiry?.toString(),
                            oauth: JSON.stringify(authResult.oauth)
                        });
                    }
                }
                break;
            case 'api_key':
                console.log(`[AuthHandlerV2] Attempting API key authentication for operation: ${operationName}`);
                if(spiderToken) {
                    const apiKeyAuthResult = await authService.authenticateByAPIKey(spiderToken);
                    if (apiKeyAuthResult.isAuthenticated) {
                        console.log(`[AuthHandlerV2] API key authentication successful for user: ${apiKeyAuthResult.userId}`);
                        return generateAllow(apiKeyAuthResult.oauth?.clientId || "unknown", event.methodArn, {
                            userId: apiKeyAuthResult.userId,
                            displayName: apiKeyAuthResult.displayName,
                            oauth: JSON.stringify(apiKeyAuthResult.oauth),
                        });
                    } else {
                        console.warn(`[AuthHandlerV2] API key authentication failed`);
                    }
                } else {
                    console.warn(`[AuthHandlerV2] No API key found in the spider-access-token`);
                }
            case 'cognito':
                console.log(`[AuthHandlerV2] Attempting Cognito authentication for operation: ${operationName}`);
                if (spiderToken) {
                    console.log(`[AuthHandlerV2] Found Cognito Token`)
                    authResult = await authService.authenticateByCognito(spiderToken);
                    if (authResult.isAuthenticated) {
                        // Check for protected paths
                        if (operationConfig.legacy?.checkAuthZ || Object.values(AUTH_CONFIG.PROTECTED_PATHS).includes(event.path)) {
                            const serverAccess = await authService.checkServerAccessForCognitoUsername(authResult.displayName || "");
                            if (!serverAccess.isAuthenticated) {
                                console.warn(`[AuthHandlerV2] Server access denied for user: ${authResult.userId}`);
                                continue;
                            }
                        }
                        console.log(`[AuthHandlerV2] Cognito authentication successful for user: ${authResult.userId}`);
                        return generateAllow(authResult.userId || "cognito_user", event.methodArn, {
                            user: authResult.userId,
                            displayName: authResult.displayName
                        });
                    }
                }
                break;
        }
    }

    // If all authentication methods fail
    console.error(`[AuthHandlerV2] All authentication methods failed for operation: ${operationName}`);
    return generateDeny("unknown", event.methodArn, {
        message: "Authentication failed"
    });
};


const authHandlerV1 = async( event: event, context) => {
    const token: string | undefined = event.headers["spider-access-token"];
    const bearerToken: string | undefined = event.headers["authorization"]?.split(" ")[1] || event.headers["Authorization"]?.split(" ")[1];
    const cookieString: string | undefined = event.headers["cookie"] ?? event.headers["Cookie"];
    let cookieAuthResult: AuthenticationResult | undefined;

    const isBypassRoute = AUTH_CONFIG.BYPASS_AUTH_PATHS.some(bypassedPath => event.path.startsWith(bypassedPath));
    console.log(`[AuthHandlerV1] isBypassRoute: ${isBypassRoute} for path: ${event.path}`)
    console.log(`[AuthHandlerV1] Has token: ${!!token}, Has cookie: ${!!cookieString}, Has bearer token: ${!!bearerToken}`);
    // No token or cookie provided
    if (!token && !cookieString && !bearerToken && !isBypassRoute) {
        console.warn(`[AuthHandlerV1] Authentication failed: No token or cookie provided for path: ${event.path}`);
        return generateDeny("unknown", event.methodArn, {
            "message": "No auth token"
        });
    }
    // try API key authentication initially, right now is checking spider-access-token
    if(token) {
        console.log(`[AuthHandlerV1] Attempting API key authentication`);
        const apiKeyAuthResult = await authService.authenticateByAPIKey(token);
        if (apiKeyAuthResult.isAuthenticated) {
            console.log(`[AuthHandlerV1] API key authentication successful for user: ${apiKeyAuthResult.userId}`);
            return generateAllow(apiKeyAuthResult.oauth?.clientId || "unknown", event.methodArn, {
                userId: apiKeyAuthResult.userId,
                displayName: apiKeyAuthResult.displayName,
                oauth: JSON.stringify(apiKeyAuthResult.oauth),
            });
        } else {
            console.warn(`[AuthHandlerV1] API key authentication failed`);
        }
    }

    // Try bearer token authentication
    if(bearerToken) {
        console.log(`[AuthHandlerV1] Attempting bearer token authentication`);
        const bearerTokenAuthResult = await authService.authenticateByBearerToken(bearerToken);
        if (bearerTokenAuthResult.isAuthenticated) {
            console.log(`[AuthHandlerV1] Bearer token authentication successful for user: ${bearerTokenAuthResult.userId}`);
            return generateAllow(bearerTokenAuthResult.userId || "unknown", event.methodArn, {
                userId: bearerTokenAuthResult.userId,
                displayName: bearerTokenAuthResult.displayName,
                siteAccess: bearerTokenAuthResult.siteAccess?.join(", "),
                apiAccess: bearerTokenAuthResult.apiAccess?.join(", "),
                tokenExpiry: bearerTokenAuthResult.tokenExpiry?.toString(),
                // TODO extrac this logic out
                oauth: JSON.stringify(bearerTokenAuthResult.oauth),
            });
        } else {
            console.warn(`[AuthHandlerV1] Bearer token authentication failed`);
        }
    }

    // Try cookie authentication first
    if (cookieString) {
        console.log(`[AuthHandlerV1] Attempting cookie authentication`);
        cookieAuthResult = await authService.authenticateByCookie(cookieString);
        
        if (cookieAuthResult.isAuthenticated) {
            console.log(`[AuthHandlerV1] Cookie authentication successful for user: ${cookieAuthResult.userId}`);
            return generateAllow(cookieAuthResult.userId || "unknown", event.methodArn, {
                userId: cookieAuthResult.userId,
                displayName: cookieAuthResult.displayName,
                siteAccess: cookieAuthResult.siteAccess?.join(","),
                apiAccess: cookieAuthResult.apiAccess?.join(","),
                tokenExpiry: cookieAuthResult.tokenExpiry ? cookieAuthResult.tokenExpiry.toString() : undefined
            });
        } else {
            console.warn(`[AuthHandlerV1] Cookie authentication failed`);
        }
    }

    // Bypass authentication for specific paths
    if (isBypassRoute) {
        console.log(`[AuthHandlerV1] Bypassing authentication for path: ${event.path}. Path is in BYPASS_AUTH_PATHS.`);
        if (cookieAuthResult !== undefined) {
            // this branch will actually never get hit, it'll fall into the cookie auth block above
            console.log(`[AuthHandlerV1] Bypass Auth Route - Cookie authentication successful for user: ${cookieAuthResult.userId}`);
            return generateAllow(cookieAuthResult?.userId || "unknown", event.methodArn, {
                userId: cookieAuthResult.userId,
                displayName: cookieAuthResult.displayName,
                siteAccess: cookieAuthResult.siteAccess?.join(", "),
                apiAccess: cookieAuthResult.apiAccess?.join(", "),
                tokenExpiry: cookieAuthResult.tokenExpiry ? cookieAuthResult.tokenExpiry.toString() : undefined
            });
        }
        return generateAllow("unknown", event.methodArn);
    }
    // Try Cognito authentication
    if (token) {
        console.log(`[AuthHandlerV1] Attempting Cognito token authentication`);
        const cognitoAuth = await authService.authenticateByCognito(token);
        
        if (cognitoAuth.isAuthenticated) {
            // Special handling for server start/stop paths, handled in api layer for the cookie auth
            if (Object.values(AUTH_CONFIG.PROTECTED_PATHS).includes(event.path)) {
                console.log(`[AuthHandlerV1] Checking server access for protected path: ${event.path}`);
                const serverAccessCheck = await authService.checkServerAccessForCognitoUsername(cognitoAuth.displayName || "");
                
                if (serverAccessCheck.isAuthenticated) {
                    console.log(`[AuthHandlerV1] Server access granted for user: ${cognitoAuth.userId} - ${cognitoAuth.displayName}`);
                    return generateAllow(cognitoAuth.userId || 'cognito_user', event.methodArn, { 
                        // Legacy auth used user, rather than userId. 
                        user: cognitoAuth.userId, 
                        displayName: cognitoAuth.displayName 
                    });
                } else {
                    console.warn(`[AuthHandlerV1] Server access denied for user: ${cognitoAuth.userId}. Reason: ${serverAccessCheck.message}`);
                    return generateDeny(cognitoAuth.userId || 'cognito_user', event.methodArn, { 
                        message: serverAccessCheck.message || "Not allowed to access this path" 
                    });
                }
            }

            // Default allow for other paths
            console.log(`[AuthHandlerV1] Cognito authentication successful for user: ${cognitoAuth.userId}`);
            return generateAllow(cognitoAuth.userId || "cognito_user", event.methodArn, { 
                user: cognitoAuth.userId, 
                displayName: cognitoAuth.displayName 
            });
        } else {
            console.warn(`[AuthHandlerV1] Cognito authentication failed for token`);
        }
    }

    // If all authentication methods fail
    console.error(`[AuthHandlerV1] Authentication failed for request. Request ID: ${event.requestContext.requestId}`);
    return generateDeny(event.requestContext.requestId, event.methodArn, { 
        message: "Unable to authenticate" 
    });
}
