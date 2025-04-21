import { describe, expect, beforeEach, it, jest } from "@jest/globals";
import { OAuthLogoutOperation } from "./OAuthLogoutOperation";
import { getOIDCClientAccessor, getAuthorizationAccessor, getTokenAccessor } from "../../accessors/AccessorFactory";
import { OAuthError } from "iron-spider-ssdk";
import { Temporal } from "temporal-polyfill";

// Mock console methods to reduce noise in test output
beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    jest.restoreAllMocks();
});

// Mock the accessors
jest.mock("../../accessors/AccessorFactory");

describe("OAuthLogoutOperation", () => {
    const mockClient = {
        clientId: "test-client",
        clientName: "Test Client",
        clientSecret: "secret",
        redirectUris: ["https://test.com/callback"],
        scopes: ["openid"]
    };

    const mockToken = {
        tokenId: "test-token-id",
        token: "test-token",
        authorizationId: "test-auth-id",
        sessionId: "test-session-id",
        userId: "test-user-id",
        clientId: "test-client",
        tokenType: "refresh",
        scopes: ["openid"],
        issuedAt: Temporal.Now.instant(),
        expiresAt: Temporal.Now.instant().add({ hours: 1 })
    };

    beforeEach(() => {
        jest.resetAllMocks();
        
        (getOIDCClientAccessor as jest.Mock).mockReturnValue({
            getClient: jest.fn(async () => mockClient)
        });
        
        (getTokenAccessor as jest.Mock).mockReturnValue({
            getToken: jest.fn(async () => mockToken),
            deleteToken: jest.fn(async () => {})
        });
        
        (getAuthorizationAccessor as jest.Mock).mockReturnValue({
            removeTokensFromAuthorizationBySessionId: jest.fn(async () => ["token1", "token2"])
        });
    });

    it("should successfully logout and delete all related tokens", async () => {
        const input = {
            client_id: "test-client",
            postLogoutRedirectUri: "https://test.com/logout",
            idTokenHint: "valid-token",
            state: "test-state"
        };

        const result = await OAuthLogoutOperation(input, {});

        expect(result).toEqual({
            redirect_uri: "https://test.com/logout",
            state: "test-state"
        });

        const tokenAccessor = getTokenAccessor();
        const authAccessor = getAuthorizationAccessor();

        expect(tokenAccessor.getToken).toHaveBeenCalledWith("valid-token");
        expect(authAccessor.removeTokensFromAuthorizationBySessionId)
            .toHaveBeenCalledWith("test-auth-id", "test-session-id", "test-user-id");
        expect(tokenAccessor.deleteToken).toHaveBeenCalledTimes(2);
    });

    it("should throw error when client is not found", async () => {
        (getOIDCClientAccessor as jest.Mock).mockReturnValue({
            getClient: jest.fn(async () => null)
        });

        const input = {
            client_id: "invalid-client",
            postLogoutRedirectUri: "https://test.com/logout",
            idTokenHint: "valid-token"
        };

        await expect(OAuthLogoutOperation(input, {}))
            .rejects
            .toThrow(OAuthError);
    });

    it("should throw error when token is invalid", async () => {
        (getTokenAccessor as jest.Mock).mockReturnValue({
            getToken: jest.fn(async () => {throw new OAuthError({message:"boom"})}),
            deleteToken: jest.fn()
        });

        const input = {
            client_id: "test-client",
            postLogoutRedirectUri: "https://test.com/logout",
            idTokenHint: "invalid-token"
        };

        await expect(OAuthLogoutOperation(input, {}))
            .rejects
            .toThrow();
    });

    it("should throw error when required parameters are missing", async () => {
        const input = {
            client_id: "test-client"
        };

        await expect(OAuthLogoutOperation(input as any, {}))
            .rejects
            .toThrow(OAuthError);
    });
});