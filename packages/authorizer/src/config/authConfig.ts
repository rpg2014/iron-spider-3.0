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
        '/.well-known/jwks.json'
    ],
    PROTECTED_PATHS: {
        SERVER_START: '/server/start',
        SERVER_STOP: '/server/stop'
    }
};
