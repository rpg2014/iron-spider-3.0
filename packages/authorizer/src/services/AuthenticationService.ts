import { CognitoJwtVerifier } from "aws-jwt-verify";
import { JWTProcessor as jwtlib } from 'jwt-lib';
import * as AuthDynamoWrapper from '../AuthDynamoWrapper';
import { AUTH_CONFIG } from '../config/authConfig';

export interface AuthenticationResult {
    isAuthenticated: boolean;
    userId?: string;
    displayName?: string;
    siteAccess?: string[];
    apiAccess?: string[];
    tokenExpiry?: number;
    message?: string;
}

export class AuthenticationService {
    private cognitoVerifier: ReturnType<typeof CognitoJwtVerifier.create>;

    constructor() {
        this.cognitoVerifier = CognitoJwtVerifier.create({
            userPoolId: AUTH_CONFIG.COGNITO.USER_POOL_ID,
            tokenUse: "access",
            clientId: AUTH_CONFIG.COGNITO.CLIENT_ID,
            includeRawJwtInErrors: false
        });
    }

    private parseCookies(cookieString?: string): Record<string, string> {
        if (!cookieString) return {};
        
        return cookieString.split(";").reduce((cookies, cookie) => {
            const [key, value] = cookie.trim().split("=");
            cookies[key.trim()] = value;
            return cookies;
        }, {} as Record<string, string>);
    }

    async authenticateByCookie(cookieString: string): Promise<AuthenticationResult> {
        const cookies = this.parseCookies(cookieString);
        const userCookie = cookies[AUTH_CONFIG.COOKIE.USER_TOKEN_COOKIE_NAME];

        if (!userCookie) {
            return { isAuthenticated: false, message: "No user cookie found" };
        }

        try {
            const verifiedToken = await jwtlib.verifyToken(userCookie);
            return {
                isAuthenticated: true,
                userId: verifiedToken.userId,
                displayName: verifiedToken.displayName,
                siteAccess: verifiedToken.siteAccess,
                apiAccess: verifiedToken.apiAccess,
                tokenExpiry: (verifiedToken as any).exp
            };
        } catch (error) {
            console.error("Cookie authentication failed:", error);
            return { isAuthenticated: false, message: "Invalid cookie" };
        }
    }

    async authenticateByCognito(token: string): Promise<AuthenticationResult> {
        try {
            await this.cognitoVerifier.hydrate();
            const payload = await this.cognitoVerifier.verify(token);
            console.log("Cognito authentication successful for user:", payload.username)
            return {
                isAuthenticated: true,
                userId: payload.sub as any,
                displayName: payload.username as any
            };
        } catch (error) {
            console.error("Cognito authentication failed:", error);
            return { isAuthenticated: false, message: "Unable to verify JWT" };
        }
    }

    async checkServerAccessForCognitoUsername(username: string): Promise<AuthenticationResult> {
        // Validate username
        if (!username) {
            return { 
                isAuthenticated: false, 
                message: "Invalid username" 
            };
        }

        try {
            const authDetails = await AuthDynamoWrapper.isAuthorized(username);
            
            if (authDetails.allowedToStartServer) {
                await AuthDynamoWrapper.startedServer(authDetails);
                return {
                    isAuthenticated: true,
                    userId: authDetails.username,
                    displayName: authDetails.username
                };
            }

            return { 
                isAuthenticated: false, 
                message: "Not allowed to start server" 
            };
        } catch (error) {
            console.error("Server access check failed:", error);
            return { 
                isAuthenticated: false, 
                message: "Server access verification failed" 
            };
        }
    }
}
