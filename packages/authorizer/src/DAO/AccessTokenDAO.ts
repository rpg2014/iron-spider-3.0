

export interface AccessTokenInfo {
    clientId: string;
    userId: string;
    scopes: string[];
    expiresAt: number;
}

abstract class AccessTokenValidator {
    abstract checkToken(token: string): Promise<AccessTokenInfo>;
}


export class FakeAccessTokenValidator extends AccessTokenValidator {
    static getInstance() {
        return new FakeAccessTokenValidator();
    }
    async checkToken(token: string): Promise<AccessTokenInfo> {
        throw new Error("Method not implemented.");
        return {
            clientId: 'fake-client-id',
            userId: 'fake-user-id',
            scopes: ['fake-scope'],
            expiresAt: Date.now() + 1000 * 60 * 60 * 24
        }
    }
}