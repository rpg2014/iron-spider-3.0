import { CognitoJwtVerifier } from "aws-jwt-verify";
import { event } from "./model/models";
import { generateAllow, generateDeny } from "./utils";
import * as AuthDynamoWrapper from './AuthDynamoWrapper';


const verifier = CognitoJwtVerifier.create({
    userPoolId: "us-east-1_mX9fI3lzt",
    tokenUse: "access",
    clientId: "333d4m712mtbsjpaj5efdj0fh4",
    includeRawJwtInErrors: true
});
const createAllowForUser = (userName: string, methodArn: string, callback: any)=> {
    return callback(null, generateAllow("user", methodArn, { user: userName, username: userName }))
}
export const authHandler = async (event: event, context, callback) => {
    //Not sure if this is necessary
    await verifier.hydrate()
    

    //Bypass auth for these functions 
    if (event.path === '/server/status') {
        callback(null, generateAllow("unknown", event.methodArn, { username: "unknown" }))
    }
    const token: string | undefined = event.headers["spider-access-token"];
    console.log(`spider access token: ${event.headers["spider-access-token"]}`)
    if (!token) {
        callback(null, generateDeny("user", event.methodArn, {
            "message": "No auth token"
        }))
    } else {
        try {

            const payload = await verifier.verify(token)
            console.log(`Verified ${payload.username}`)
            //If the path is server/start or stop, check auth dynamo to see if user has access based on the code here: https://github.com/rpg2014/iron-spider-2.0/blob/7801cda458f31f960f71ce529c552e9717d07f48/src/main/java/com/rpg2014/model/AuthenticationProvider.java#L15
            if (event.path === '/server/start' || event.path === '/server/stop') {

                const authDetails = await AuthDynamoWrapper.isAuthorized(payload.username)
                if( authDetails.allowedToStartServer ) {
                    await AuthDynamoWrapper.startedServer(authDetails)
                    createAllowForUser(payload.username, event.methodArn, callback)
                } else {
                    callback(null, generateDeny('user', event.methodArn, { message: "Not allowed to start server" }))
                }
            }
            
            // Other methods
            callback(null, generateAllow("user", event.methodArn, { user: payload.username, username: payload.username }))
        } catch (e) {
            console.error(e)
            console.log(`Unable to verify user, rejecting`)
            callback(null, generateDeny('user', event.methodArn, { message: "Unable to verify jwt" }))
        }
    }
}


