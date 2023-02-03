import { CognitoJwtVerifier } from "aws-jwt-verify";
import { event } from "./model/models";
import { generateAllow, generateDeny } from "./utils";

const verifier = CognitoJwtVerifier.create({
    userPoolId: "us-east-1_mX9fI3lzt",
    tokenUse: "access",
    clientId: "333d4m712mtbsjpaj5efdj0fh4",
    includeRawJwtInErrors: true
  });

export const authHandler = async (event: event, context, callback) => {     
    //Not sure if this is necessary
    await verifier.hydrate()  
    
    //Bypass auth for these functions 
    if(event.path === '/server/status'){
        callback(null, generateAllow("unknown", event.methodArn, {username: "unknown"}))
    }
    const token: string | undefined = event.headers["spider-access-token"];
    console.log(`spider access token: ${event.headers["spider-access-token"]}`)
    if(!token) {
        callback(null, generateDeny("user", event.methodArn, {
            "message": "No auth token"
        }))
    } else {
        try {
            
            const payload = await verifier.verify(token)
            console.log(`Verified ${payload.username}`)
            //todo: get username from the payload and then pass it in as the principle or in the context?
            callback(null, generateAllow("user", event.methodArn, {user: payload.username}))
        }catch (e){ 
            console.error(e)
            console.log(`Unable to verify user, rejecting`)
            callback(null, generateDeny('user', event.methodArn,{message: "Unable to verify jwt"}))   
        }
    }
}