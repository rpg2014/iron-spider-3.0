import type { Temporal } from "temporal-polyfill";

export interface Authorization {
    authorizationId?: string;
    clientId: string;
    userId: string;
    scopes: string[];
    authCode?: string;
    authCodeInfo?: {
        used: boolean;
        /* ISO Date*/
        expiresAt: Temporal.Instant;
    };
    accessToken?: string;
    accessTokenInfo?: {
        issuedAt: Temporal.Instant;
        expiresAt: Temporal.Instant;
    };
    accessTokens?: Token[];
    refreshToken?: string;
    refreshTokenInfo?: {
        issuedAt: Temporal.Instant;
        expiresAt: Temporal.Instant;
    }
    refreshTokens?: Token[];
    codeChallenge?: string;
    codeChallengeMethod?: string;
    created: Temporal.Instant;
    lastUpdatedDate?: Temporal.Instant;
  }
  export type Token = {
    token: string,
    issuedAt: Temporal.Instant,
    expiresAt: Temporal.Instant
  }
  export type DDBToken = {
    token: string,
    issuedAt:  string,
    expiresAt:string
  }
  // same thing as above but dates are iso strings
  export interface DDBAuthorization {
    authorizationId?: string;
    clientId: string;
    userId: string;
    scopes: string[];
    authCode?: string;
    authCodeInfo?: {
        used: boolean;
        expiresAt: string;
    };
    accessToken?: string;
    accessTokenInfo?: {
        issuedAt: string;
        expiresAt: string;
    };
    accessTokens?: DDBToken[];
    refreshToken?: string;
    refreshTokenInfo?: {
        issuedAt: string;
        expiresAt: string;
    },
    refreshTokens?: DDBToken[];
    codeChallenge?: string;
    codeChallengeMethod?: string;
    created: string;
    lastUpdatedDate?: string;
  }
  export interface CreateAuthorizationInput {
    clientId: string;
    userId: string;
    scopes: string[];
    code_challenge?: string;
    code_challenge_method?: string;
  }