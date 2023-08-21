import {UserAccessor} from "../AccessorInterfaces";
import {UserModel} from "../../model/Auth/authModels";


export class DynamoUserAccessor extends UserAccessor {
    constructor() {
        super();
    }
    createUser(user: UserModel): void {
    }

    getUser(id: string): UserModel {
        return {access: [], credentials: [], displayName: "", email: "", emailValidated: false, id: ""};
    }

    saveChallenge(userId: string, challenge: string): void {
    }


}