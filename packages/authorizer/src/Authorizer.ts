import { event } from "./model/models";
import { generateAllow, generateDeny } from "./utils";
import { AUTH_CONFIG } from "./config/authConfig";
import { AuthenticationResult, AuthenticationService } from "./services/AuthenticationService";


const authService = new AuthenticationService();
export const authHandler = async (event: event, context) => {
    console.log(`[AuthHandler] Received request for path: ${event.path}, method: ${event.httpMethod}`);
    console.log(`[AuthHandler] Request context: ${JSON.stringify(event.requestContext)}`);
    
    const token: string | undefined = event.headers["spider-access-token"];
    const cookieString: string | undefined = event.headers["cookie"];
    let cookieAuthResult: AuthenticationResult | undefined;

    const isBypassRoute = AUTH_CONFIG.BYPASS_AUTH_PATHS.some(bypassedPath => event.path.startsWith(bypassedPath));
    console.log(`[AuthHandler] isBypassRoute: ${isBypassRoute} for path: ${event.path}`)

    // No token or cookie provided
    if (!token && !cookieString && !isBypassRoute) {
        console.warn(`[AuthHandler] Authentication failed: No token or cookie provided for path: ${event.path}`);
        return generateDeny("unknown", event.methodArn, {
            "message": "No auth token"
        });
    }

    // Try cookie authentication first
    if (cookieString) {
        console.log(`[AuthHandler] Attempting cookie authentication`);
        cookieAuthResult = await authService.authenticateByCookie(cookieString);
        
        if (cookieAuthResult.isAuthenticated) {
            console.log(`[AuthHandler] Cookie authentication successful for user: ${cookieAuthResult.userId}`);
            return generateAllow(cookieAuthResult.userId || "unknown", event.methodArn, {
                userId: cookieAuthResult.userId,
                displayName: cookieAuthResult.displayName,
                siteAccess: cookieAuthResult.siteAccess?.join(","),
                apiAccess: cookieAuthResult.apiAccess?.join(","),
                tokenExpiry: cookieAuthResult.tokenExpiry ? cookieAuthResult.tokenExpiry.toString() : undefined
            });
        } else {
            console.warn(`[AuthHandler] Cookie authentication failed`);
        }
    }

    // Bypass authentication for specific paths
    if (isBypassRoute) {
        console.log(`[AuthHandler] Bypassing authentication for path: ${event.path}. Path is in BYPASS_AUTH_PATHS.`);
        if (cookieAuthResult !== undefined) {
            // this branch will actually never get hit, it'll fall into the cookie auth block above
            console.log(`[AuthHandler] Bypass Auth Route - Cookie authentication successful for user: ${cookieAuthResult.userId}`);
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
        console.log(`[AuthHandler] Attempting Cognito token authentication`);
        const cognitoAuth = await authService.authenticateByCognito(token);
        
        if (cognitoAuth.isAuthenticated) {
            // Special handling for server start/stop paths, handled in api layer for the cookie auth
            if (Object.values(AUTH_CONFIG.PROTECTED_PATHS).includes(event.path)) {
                console.log(`[AuthHandler] Checking server access for protected path: ${event.path}`);
                const serverAccessCheck = await authService.checkServerAccess(cognitoAuth.userId || "");
                
                if (serverAccessCheck.isAuthenticated) {
                    console.log(`[AuthHandler] Server access granted for user: ${cognitoAuth.userId}`);
                    return generateAllow(cognitoAuth.userId || 'cognito_user', event.methodArn, { 
                        user: cognitoAuth.userId, 
                        displayName: cognitoAuth.displayName 
                    });
                } else {
                    console.warn(`[AuthHandler] Server access denied for user: ${cognitoAuth.userId}. Reason: ${serverAccessCheck.message}`);
                    return generateDeny(cognitoAuth.userId || 'cognito_user', event.methodArn, { 
                        message: serverAccessCheck.message || "Not allowed to access this path" 
                    });
                }
            }

            // Default allow for other paths
            console.log(`[AuthHandler] Cognito authentication successful for user: ${cognitoAuth.userId}`);
            return generateAllow(cognitoAuth.userId || "cognito_user", event.methodArn, { 
                user: cognitoAuth.userId, 
                displayName: cognitoAuth.displayName 
            });
        } else {
            console.warn(`[AuthHandler] Cognito authentication failed for token`);
        }
    }

    // If all authentication methods fail
    console.error(`[AuthHandler] Authentication failed for request. Request ID: ${event.requestContext.requestId}`);
    return generateDeny(event.requestContext.requestId, event.methodArn, { 
        message: "Unable to authenticate" 
    });
};
