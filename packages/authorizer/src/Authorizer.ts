import { CognitoJwtVerifier } from "aws-jwt-verify";
import { event } from "./model/models";
import { generateAllow, generateDeny } from "./utils";
import * as AuthDynamoWrapper from './AuthDynamoWrapper';
import {JWTProcessor as jwtlib} from 'jwt-lib/src/index';

export const USER_TOKEN_COOKIE_NAME: string = "x-pg-id";
const bypass_auth_for_paths = ['/v1/registration', "/v1/authentication", "/server/status", "/v1/userInfo"]

const verifier = CognitoJwtVerifier.create({
    userPoolId: "us-east-1_mX9fI3lzt",
    tokenUse: "access",
    clientId: "333d4m712mtbsjpaj5efdj0fh4",
    includeRawJwtInErrors: false
});
export const authHandler = async (event: event, context) => {
    //TODO, log the time this takes to execute
    console.log(`Got request for path ${event.path}`)
    const token: string | undefined = event.headers["spider-access-token"];
    console.log(`spider access token: ${event.headers["spider-access-token"]}`)
    const cookieString: string | undefined = event.headers["cookie"];
    console.log(`cookie: ${cookieString}`)

    let verifiedToken;
    // try to validate cookie
    // //first try cookie auth
    //parse string of cookies into a Record<string, string>
    if(cookieString){
        const cookies: Record<string, string> ={};
        cookieString.split(";").forEach((cookie)=> {
            const [key, value] = cookie.split("=");
            cookies[key] = value;
        })
        // todo: use access token instead, for now just verify id
        if(cookies[USER_TOKEN_COOKIE_NAME]) {
            console.log("found user cookie")
            try {
                console.log("verifying cookie")
                //TODO verify audience is the right client?
                verifiedToken = await jwtlib.verifyToken(cookies[USER_TOKEN_COOKIE_NAME])
                console.log("verified cookie for user ", verifiedToken.userId)
                
                
            }catch(e){
                console.error(e)
                console.log("Trying header token auth instead")
                //for now fall back to header token auth.
                // return generateDeny("unknown", event.methodArn, {
                //     "message": "Invalid cookie"
                // })
            }

        }
    }


    //Bypass auth for these functions 
    if(bypass_auth_for_paths.findIndex((bypassedPath) => event.path.startsWith(bypassedPath)) > -1) {
        console.log("Bypassing auth")
        // return cookie data if present and valid
        return generateAllow("unknown", event.methodArn, verifiedToken ? {
            userId: verifiedToken.userId, 
            displayName: verifiedToken.displayName,
            siteAccess: verifiedToken.siteAccess.join(","),
            apiAccess: verifiedToken.apiAccess.join(","),
            tokenExpiry: (verifiedToken as any).exp ,
        }: {})
    }
    // if no token or cookie auto deny
    if (!token && !cookieString) {
        console.log("No auth token")
        return generateDeny("unknown", event.methodArn, {
            "message": "No auth token"
        })
    }
    // if cookie is valid, return allow
    // todo verify api and site access, before allowing
    if(verifiedToken) {
        return generateAllow(verifiedToken.userId,event.methodArn, {
            userId: verifiedToken.userId, 
            displayName: verifiedToken.displayName,
            siteAccess: verifiedToken.siteAccess.join(","),
            apiAccess: verifiedToken.apiAccess.join(","),
            tokenExpiry: (verifiedToken as any).exp ,
        })
    } // else try cognito and the token
    try {
        console.log("hydrating jwks cognito keys")
        //Not sure if this is necessary
        await verifier.hydrate()
        console.log('Verifying')
        
        const payload = await verifier.verify(token)
        console.log(`Verified ${payload.username}`)
        //If the path is server/start or stop, check auth dynamo to see if user has access based on the code here: https://github.com/rpg2014/iron-spider-2.0/blob/7801cda458f31f960f71ce529c552e9717d07f48/src/main/java/com/rpg2014/model/AuthenticationProvider.java#L15
        // this should be done by  the buisness logic code, not the authorizer. 
        // will leave in here for now, but auth needs to be done somewhere
        if (event.path === '/server/start' || event.path === '/server/stop') {
            console.log("Path requires access")
            const authDetails = await AuthDynamoWrapper.isAuthorized(payload.username)
            if( authDetails.allowedToStartServer ) {
                await AuthDynamoWrapper.startedServer(authDetails)
                return generateAllow("cognito_user", event.methodArn, { user: payload.userName as any, displayName: payload.userName as any })
            } else {
                return generateDeny('cognito_user', event.methodArn, { message: "Not allowed to start server" })
            }
        }else {
            console.log("Path doens't require access, allowing")
            // Other methods
            return generateAllow("cognito_user", event.methodArn, { user: payload.username, displayName: payload.username })
        }
    } catch (e) {
        console.error(e)
        console.log(`Unable to verify user, rejecting`)
        return generateDeny('user', event.methodArn, { message: "Unable to verify jwt" })
    }
    
}


