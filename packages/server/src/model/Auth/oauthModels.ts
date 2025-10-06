import type { Temporal } from "temporal-polyfill";

/**
 * Represents an OAuth authorization between a user and a client
 */
export interface Authorization {
    authorizationId?: string;
    clientId: string;
    userId: string;
    scopes: string[];
    
    // Auth code related fields
    authCode?: string;
    authCodeInfo?: {
        used: boolean;
        expiresAt: Temporal.Instant;
    };
    codeChallenge?: string;
    codeChallengeMethod?: string;
    
    // Token collections - primary way to store tokens
    accessTokens: Token[];
    refreshTokens: Token[];
    
    // Metadata
    created: Temporal.Instant;
    lastUpdatedDate?: Temporal.Instant;
    
    // Legacy fields - marked as deprecated
    /** @deprecated Use accessTokens instead */
    accessToken?: string;
    /** @deprecated Use accessTokens instead */
    accessTokenInfo?: {
        issuedAt: Temporal.Instant;
        expiresAt: Temporal.Instant;
    };
    /** @deprecated Use refreshTokens instead */
    refreshToken?: string;
    /** @deprecated Use refreshTokens instead */
    refreshTokenInfo?: {
        issuedAt: Temporal.Instant;
        expiresAt: Temporal.Instant;
    };
}
/**
 * Represents an OAuth token (access or refresh)
 */
export interface Token {
    tokenId: string;       // Partition key (generated UUID)
    token: string;         // The actual token value - with GSI
    authorizationId: string; // With GSI for lookups
    sessionId: string; // the session of the token, will be shared with the related  other tokentype.  Referrs to a specific auth grant. 
    userId: string;        // Useful for queries
    clientId: string;      // For additional context
    tokenType: 'access' | 'refresh';
    scopes?: string[];     // Scopes associated with this token
    issuedAt: Temporal.Instant;
    expiresAt: Temporal.Instant;     // Can be used for TTL
    metadata?: Record<string, any>; // Optional additional data
}
/**
 * DynamoDB representation of an OAuth token
 */
export interface DDBToken {
    tokenId: string;       // Partition key (generated UUID)
    token: string;         // The actual token value - with GSI
    authorizationId: string; // With GSI for lookups
    sessionId: string; // the session of the token, will be shared with the related  other tokentype.  Referrs to a specific auth grant. 
    userId: string;        // Useful for queries
    clientId: string;      // For additional context
    tokenType: 'access' | 'refresh';
    scopes?: string[];     // Scopes associated with this token
    issuedAt: string;
    expiresAt: string;     // Can be used for TTL
    ttl: number;           // TTL field for DynamoDB (Unix timestamp in seconds)
    metadata?: Record<string, any>; // Optional additional data
}
/**
 * DynamoDB representation of an OAuth authorization
 */
export interface DDBAuthorization {
    authorizationId?: string;
    clientId: string;
    userId: string;
    scopes: string[];
    
    // Auth code related fields
    authCode?: string;
    authCodeInfo?: {
        used: boolean;
        expiresAt: string;
    };
    codeChallenge?: string;
    codeChallengeMethod?: string;
    
    // just storing the token ids.
    accessTokens?: string[];
    refreshTokens?: string[];
    
    // Metadata
    created: string;
    lastUpdatedDate?: string;
    
    // Legacy fields
    accessToken?: string;
    accessTokenInfo?: {
        issuedAt: string;
        expiresAt: string;
    };
    refreshToken?: string;
    refreshTokenInfo?: {
        issuedAt: string;
        expiresAt: string;
    };
}
/**
 * Input for creating a new authorization
 */
export interface CreateAuthorizationInput {
    clientId: string;
    userId: string;
    scopes: string[];
    code_challenge?: string;
    code_challenge_method?: string;
}
