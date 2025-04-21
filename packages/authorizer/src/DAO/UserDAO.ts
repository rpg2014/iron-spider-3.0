import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

// Interface for user data
export interface UserInfo {
    id: string;
    displayName: string;
    siteAccess: string[];
    apiAccess: string[];
}

// Interface for DynamoDB user item
interface DDBUser {
    id: string;        // Partition key
    displayName: string;
    siteAccess?: string[];
    apiAccess?: string[];
    metadata?: Record<string, any>; // Optional additional data
}

// Abstract base class for user data access
abstract class UserDAO {
    abstract getUserById(id: string): Promise<UserInfo>;
}

// DynamoDB implementation of UserDAO
export class DynamoDBUserDAO extends UserDAO {
    private dynamodbClient: DynamoDBDocumentClient;

    constructor() {
        super();
        const client = new DynamoDBClient({});
        this.dynamodbClient = DynamoDBDocumentClient.from(client);
    }

    static getInstance() {
        return new DynamoDBUserDAO();
    }

    async getUserById(id: string): Promise<UserInfo> {
        console.log('[DynamoDBUserDAO.getUserById] Fetching user by ID:', id);
        
        const params = {
            TableName: process.env.USER_TABLE_NAME,
            Key: {
                id: id
            }
        };

        try {
            console.log('[DynamoDBUserDAO.getUserById] Getting user from DynamoDB');
            const { Item } = await this.dynamodbClient.send(new GetCommand(params));

            if (!Item) {
                console.log('[DynamoDBUserDAO.getUserById] User not found');
                throw new Error('User not found');
            }

            const userItem = Item as DDBUser;
            
            console.log('[DynamoDBUserDAO.getUserById] User found successfully');
            return {
                id: userItem.id,
                displayName: userItem.displayName,
                siteAccess: userItem.siteAccess || [],
                apiAccess: userItem.apiAccess || [],
            };
        } catch (error) {
            console.error('[DynamoDBUserDAO.getUserById] Error fetching user:', error);
            throw error;
        }
    }
}

// Fake implementation for testing or fallback
export class FakeUserDAO extends UserDAO {
    static getInstance() {
        return new FakeUserDAO();
    }

    async getUserById(id: string): Promise<UserInfo> {
        console.warn('[FakeUserDAO.getUserById] Using fake user data');
        return {
            id: id,
            displayName: 'Fake User',
            siteAccess: ['default'],
            apiAccess: ['read']
        };
    }
}

export default UserDAO;
