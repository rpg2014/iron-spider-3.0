import { CognitoJwtVerifier } from "aws-jwt-verify";
import { event } from "./model/models";
import { generateAllow, generateDeny } from "./utils";
import * as AuthDynamoWrapper from './AuthDynamoWrapper';
import {JWTProcessor as jwtlib} from 'jwt-lib/src/index';

export const USER_TOKEN_COOKIE_NAME: string = "x-pg-id";
const bypass_auth_for_paths = ['/v1/registration', "/v1/authentication", "/server/status"]

const verifier = CognitoJwtVerifier.create({
    userPoolId: "us-east-1_mX9fI3lzt",
    tokenUse: "access",
    clientId: "333d4m712mtbsjpaj5efdj0fh4",
    includeRawJwtInErrors: true
});
export const authHandler = async (event: event, context, callback) => {
    
    console.log(`Got request for path ${event.path}`)
    //Bypass auth for these functions 
    if(bypass_auth_for_paths.findIndex((bypassedPath) => event.path.startsWith(bypassedPath)) > -1) {
        console.log("Bypassing auth")
        callback(null, generateAllow("unknown", event.methodArn, {username: "unknown"}))
    }
    
    const token: string | undefined = event.headers["spider-access-token"];
    console.log(`spider access token: ${event.headers["spider-access-token"]}`)
    const cookieString: string | undefined = event.headers["cookie"];
    console.log(`cookie: ${cookieString}`)
    //parse string of cookies into a Record<string, string>
    
    if (!token && !cookieString) {
        console.log("No auth token")
        callback(null, generateDeny("unknown", event.methodArn, {
            "message": "No auth token"
        }))
    }
    try {
        // //first try cookie auth
        // if(cookieString){
        //     const cookies: Record<string, string> ={};
        //     cookieString.split(";").forEach((cookie)=> {
        //         const [key, value] = cookie.split("=");
        //         cookies[key] = value;
        //     })
        //     // todo: use access token instead
        //     if(cookies[USER_TOKEN_COOKIE_NAME]) {
        //         console.log("found user cookie")
        //         await jwtlib.verifyToken(cookies[USER_TOKEN_COOKIE_NAME])
        //     }
        // }


        console.log("hydrating jwks cognito keys")
        //Not sure if this is necessary
        await verifier.hydrate()
        console.log('Verifying')
        
        const payload = await verifier.verify(token)
        console.log(`Verified ${payload.username}`)
        //If the path is server/start or stop, check auth dynamo to see if user has access based on the code here: https://github.com/rpg2014/iron-spider-2.0/blob/7801cda458f31f960f71ce529c552e9717d07f48/src/main/java/com/rpg2014/model/AuthenticationProvider.java#L15
        if (event.path === '/server/start' || event.path === '/server/stop') {
            console.log("Path requires access")
            const authDetails = await AuthDynamoWrapper.isAuthorized(payload.username)
            if( authDetails.allowedToStartServer ) {
                await AuthDynamoWrapper.startedServer(authDetails)
                callback(null, generateAllow("user", event.methodArn, { user: payload.userName, username: payload.userName }))
            } else {
                callback(null, generateDeny('user', event.methodArn, { message: "Not allowed to start server" }))
            }
        }else {
            console.log("Path doens't require access, allowing")
            // Other methods
            callback(null, generateAllow("user", event.methodArn, { user: payload.username, username: payload.username }))
        }
    } catch (e) {
        console.error(e)
        console.log(`Unable to verify user, rejecting`)
        callback(null, generateDeny('user', event.methodArn, { message: "Unable to verify jwt" }))
    }
    
}


