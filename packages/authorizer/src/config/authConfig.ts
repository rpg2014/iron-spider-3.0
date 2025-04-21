import { IronSpiderService } from "iron-spider-ssdk";
import { OperationConfigOptions, MODERN_AUTHS, IRON_SPIDER_API_SCOPE, SERVER_SCOPE, READ_SCOPE, WRITE_SCOPE, getWebOperationPermissions, DATE_TRACKER_SCOPE } from "./utils";


export const AUTH_CONFIG = {
    COGNITO: {
        USER_POOL_ID: "us-east-1_mX9fI3lzt",
        CLIENT_ID: "333d4m712mtbsjpaj5efdj0fh4",
    },
    COOKIE: {
        USER_TOKEN_COOKIE_NAME: "x-pg-id"
    },
    BYPASS_AUTH_PATHS: [
        '/v1/registration', 
        "/v1/authentication", 
        "/server/status", 
        "/v1/userInfo", 
        '/.well-known/jwks.json',
        "/v1/oauth/tokens"
    ],
    PROTECTED_PATHS: {
        SERVER_START: '/server/start',
        SERVER_STOP: '/server/stop'
    }
};

export const OPERATION_CONFIG: Record<keyof IronSpiderService<any>, OperationConfigOptions | null | undefined> ={
    CreateUser: {
        mechanism: 'public',
    },
    GenerateRegistrationOptions: {
        mechanism: ['public']
    },
    VerifyRegistration: {
        mechanism: ['public']
    },
    GenerateAuthenticationOptions: { mechanism: "public" },
    VerifyAuthentication: { mechanism: 'public' },
    Logout: { mechanism: [...MODERN_AUTHS] },
    UserInfo: { mechanism: [...MODERN_AUTHS, 'client_secret_basic_auth'] },
    GetJwks: { mechanism: [...MODERN_AUTHS, 'client_secret_basic_auth', 'public'], doNotRequireSpiderAccessToken: true },
    GetOIDCDiscovery: {
        mechanism: [...MODERN_AUTHS, 'client_secret_basic_auth', 'public'],
        doNotRequireSpiderAccessToken: true
    },
    GetPublicKeys: { mechanism: [...MODERN_AUTHS, 'client_secret_basic_auth'] },
    // oauth
    // called from auth website using cookie auth
    GetOAuthDetails: { mechanism: ['cookie'] },
    ApproveOAuth: {
        mechanism: ['cookie'],
    },
    GetOAuthTokens: {
        mechanism: ['client_secret_basic_auth', "bearer", "public"],
        scopes: [],
        doNotRequireSpiderAccessToken: true
    },
    //mc server
    ServerStatus: {
        mechanism: ['public', 'cognito', ...MODERN_AUTHS],
        scopes: [`${IRON_SPIDER_API_SCOPE}:${SERVER_SCOPE}.${READ_SCOPE}`]
    },
    ServerDetails: {
        mechanism: ['cognito', ...MODERN_AUTHS],

        scopes: [`${IRON_SPIDER_API_SCOPE}:${SERVER_SCOPE}.${READ_SCOPE}`]
    },
    StartServer: {
        mechanism: ['cognito', ...MODERN_AUTHS],
        scopes: [`${IRON_SPIDER_API_SCOPE}:${SERVER_SCOPE}.${WRITE_SCOPE}`],
        legacy: {
            checkAuthZ: true
        }
    },
    StopServer: {
        mechanism: ['cognito', ...MODERN_AUTHS],
        scopes: [`${IRON_SPIDER_API_SCOPE}:${SERVER_SCOPE}.${WRITE_SCOPE}`],
        legacy: {
            checkAuthZ: true
        }
    },

    // date
    GetDate: getWebOperationPermissions(DATE_TRACKER_SCOPE, READ_SCOPE),
    ListDates: getWebOperationPermissions(DATE_TRACKER_SCOPE, READ_SCOPE),
    CreateDate: getWebOperationPermissions(DATE_TRACKER_SCOPE, WRITE_SCOPE),
    UpdateDate: getWebOperationPermissions(DATE_TRACKER_SCOPE, WRITE_SCOPE),
    DeleteDate: getWebOperationPermissions(DATE_TRACKER_SCOPE, WRITE_SCOPE),
    GetConnectedUsers: getWebOperationPermissions(DATE_TRACKER_SCOPE, READ_SCOPE),
    GetLocationByPlaceId: getWebOperationPermissions(DATE_TRACKER_SCOPE, WRITE_SCOPE),
    SearchForLocation: getWebOperationPermissions(DATE_TRACKER_SCOPE, WRITE_SCOPE),
    CreatePicture: undefined,
    DeletePicture: undefined,
    GetPicture: undefined,
    OAuthFormLogout: undefined,
    OAuthLogout: undefined
}
