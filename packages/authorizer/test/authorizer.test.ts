import { authHandler } from '../src/Authorizer';
import {event} from '../src/model/models';
import {beforeEach, describe, expect, test} from '@jest/globals';
import { JWTProcessor } from 'jwt-lib/src';

const getEffect =(result: any) => {
    return result.policyDocument.Statement[0].Effect
}
const DENY="Deny"
const ALLOW="Allow";
describe("Authorizer Tests" , () => {
    let e;
    beforeEach(() => {
        e = {
            "type": "REQUEST",
            "path": "/server/start",
            methodArn: "methodArn",
            "headers": {
                
                
                
            },
        }
    })
    test('Given event with no token, , generate Deny', async () => {
        
    
        const result = await authHandler(e, null)
        
        expect(getEffect(result)).toEqual("Deny")
    }); 
    test('Given event with Cookie, generate Allow', async () => {
        e.headers.Cookie = `token=${JWTProcessor.generateTokenForUser({
            userId: "userId",
            displayName: 'testname'
        })}`
        const result = await authHandler(e, null)
        
        expect(getEffect(result)).toEqual("Allow")
    })   
})

