import { authHandler } from '../src/Authorizer';
import { event } from '../src/model/models';
import { beforeEach, describe, expect, test, jest } from '@jest/globals';
import { AuthenticationService } from '../src/services/AuthenticationService';

// Mock the entire jwt-lib module
jest.mock('jwt-lib', () => ({
    JWTProcessor: {
        generateTokenForUser: jest.fn().mockReturnValue('mocked-token')
    }
}));

// Mock the AuthenticationService
jest.mock('../src/services/AuthenticationService');

const getEffect = (result: any) => {
    return result.policyDocument.Statement[0].Effect;
};

describe("Authorizer Tests", () => {
    let e: event;
    let mockAuthService: jest.Mocked<AuthenticationService>;

    beforeEach(() => {
        // Reset the mock before each test
        jest.clearAllMocks();

        // Create a mock instance of AuthenticationService
        mockAuthService = new AuthenticationService() as jest.Mocked<AuthenticationService>;

        // Create a base event object with full typing matching the models.ts interface
        e = {
            type: "REQUEST",
            methodArn: "methodArn",
            resource: "/server/start",
            path: "/server/start",
            httpMethod: "GET",
            headers: {
                "spider-access-token": "",
                "cookie": ""
            },
            queryStringParameters: {},
            requestContext: {
                path: "/server/start",
                accountId: "test-account",
                resourceId: "test-resource",
                stage: "test",
                requestId: "test-request-id",
                identity: {
                    apiKey: "test-api-key",
                    sourceIp: "127.0.0.1",
                    clientCert: {}
                }
            },
            resourcePath: "/server/start",
            apiId: "test-api-id",
        };

        // Replace the real AuthenticationService with the mock
        jest.spyOn(AuthenticationService.prototype, 'authenticateByCookie').mockImplementation(mockAuthService.authenticateByCookie);
        jest.spyOn(AuthenticationService.prototype, 'authenticateByCognito').mockImplementation(mockAuthService.authenticateByCognito);
        jest.spyOn(AuthenticationService.prototype, 'checkServerAccess').mockImplementation(mockAuthService.checkServerAccess);
    });

    test('Given event with no token, generate Deny', async () => {
        // Remove tokens for this test
        e.headers = {
            "spider-access-token": "",
            "cookie": ""
        };

        // Configure mock to return unauthenticated
        mockAuthService.authenticateByCookie.mockResolvedValue({ 
            isAuthenticated: false 
        });
        mockAuthService.authenticateByCognito.mockResolvedValue({ 
            isAuthenticated: false 
        });

        const result = await authHandler(e, null);
        
        expect(getEffect(result)).toEqual("Deny");
    }); 

    test('Given event with Cookie, generate Allow', async () => {
        // Configure mock to return authenticated for cookie
        mockAuthService.authenticateByCookie.mockResolvedValue({ 
            isAuthenticated: true,
            userId: "test-user-id",
            displayName: "Test User",
            tokenExpiry: new Date().getTime()
        });

        // Add cookie to headers
        e.headers = {
            "spider-access-token": "",
            "cookie": "test-cookie-value"
        };

        const result = await authHandler(e, null);
        
        expect(getEffect(result)).toEqual("Allow");
    });

    test('Given event with Cognito token for server start, generate Allow', async () => {
        // Configure mocks for Cognito authentication and server access
        mockAuthService.authenticateByCognito.mockResolvedValue({ 
            isAuthenticated: true,
            userId: "cognito-user-id",
            displayName: "Cognito User"
        });
        mockAuthService.checkServerAccess.mockResolvedValue({ 
            isAuthenticated: true 
        });

        // Add token to headers
        e.headers = {
            "spider-access-token": "test-cognito-token",
            "cookie": ""
        };

        const result = await authHandler(e, null);
        
        expect(getEffect(result)).toEqual("Allow");
    });
});
