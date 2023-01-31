import { CognitoJwtVerifier } from "aws-jwt-verify";
import { event } from "./model/models";
import { generateAllow, generateDeny } from "./utils";



export const authHandler = (event: event, context, callback) => {        
    //Bypass auth for these functions 
    if(event.path === '/server/status'){
        callback(null, generateAllow("unknown", event.methodArn, {username: "unknown"}))
    }
    const token: string | undefined = event.headers["spider-access-token"];
    if(!!token) {
        callback(null, generateDeny("user", event.methodArn, {
            "message": "No auth token"
        }))
    } else {
        try {
            const payload = verifier.verifySync(token)
            console.log(`Verified ${payload.username}`)
            //todo: get username from the payload and then pass it in as the principle or in the context?
            callback(null, generateAllow("user", event.methodArn))
        }catch (e){ 
            console.log(`Unable to verify user, rejecting`)
            callback(null, generateDeny('user', event.methodArn,{message: "Unable to verify jwt"}))   
        }
    }
}