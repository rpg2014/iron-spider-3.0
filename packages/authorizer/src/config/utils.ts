
export const IRON_SPIDER_API_SCOPE = 'iron-spider-api'
export const SERVER_SCOPE = 'server';
export const DATE_TRACKER_SCOPE= 'date-tracker'
export const READ_SCOPE = 'read'
export const WRITE_SCOPE = 'write'
export const MODERN_AUTHS: AuthMechanism[] = ['bearer', 'cookie']
export type AuthMechanism = 'client_secret_basic_auth' | 'public' | "bearer" | "cookie" | 'cognito'/* legacy */
export type OperationConfigOptions = {
    mechanism: AuthMechanism | AuthMechanism[]
    scopes?: string[]
    legacy?: {
        // used for cognito auth, to check permissions + record start count
        checkAuthZ?: boolean,
    },
    // bypasses the 'spider-access-token' header check
    doNotRequireSpiderAccessToken?: boolean   
}
export const getWebOperationPermissions = (domain: string, permission: string) => {
    return {
        mechanism: MODERN_AUTHS,
        scopes: [`${IRON_SPIDER_API_SCOPE}:${domain}.${permission}`]
    }
}