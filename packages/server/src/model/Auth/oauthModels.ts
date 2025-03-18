export interface Authorization {
    authorizationId?: string;
    clientId: string;
    userId: string;
    scopes: string[];
    authCode?: string;
    authCodeInfo?: {
        used: boolean;
        /* ISO Date*/
        expiresAt: Date;
    };
    accessToken?: string;
    accessTokenInfo?: {
        issuedAt: Date;
        expiresAt: Date;
    };
    refreshToken?: string;
    refreshTokenInfo?: {
        issuedAt: Date;
        expiresAt: Date;
    }
    codeChallenge?: string;
    codeChallengeMethod?: string;
    created: Date;
    lastUpdatedDate?: Date;
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
    refreshToken?: string;
    refreshTokenInfo?: {
        issuedAt: string;
        expiresAt: string;
    }
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