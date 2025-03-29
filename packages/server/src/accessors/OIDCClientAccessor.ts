import apiKeys from '../../../../.api_keys.json';

//TODO, combine this with the Server's models, probably extractall the common types to a shared package
export interface OIDCClient {
    clientId: string;
    clientName: string;
    clientSecret: string;
    redirectUris: string[];
    scopes?: string[];
    grantTypes?: string[];
    apiKey?: string;
  }
// 
abstract class OIDCClientAccessor {
    abstract getClient(clientId: string): Promise<OIDCClient>;
    abstract getClientByClientSecret(key: string): Promise<OIDCClient>
}

export class FileOIDCClientAccessor extends OIDCClientAccessor {
    static getInstance() {
        return new FileOIDCClientAccessor();
    }
    async getClient(clientId: string): Promise<OIDCClient> {
        // filter out the string
        const clients = Object.values(apiKeys).filter((client) => typeof client === 'object') as OIDCClient[];
        const client = clients.find((client) => client.clientId === clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        return client;  
    }
    async getClientByClientSecret(key: string): Promise<OIDCClient> {
        // for each client in apiKeys, check if the clientSecret matches the key
        const clients = Object.values(apiKeys).filter((client) => typeof client === 'object') as OIDCClient[];;
        const client = clients.find((client) => client.clientSecret === key);
        if (!client) {
            throw new Error('Client not found');
        }
        return client;  
    }
    async getClientByApiKey(key: string): Promise<OIDCClient> {
        const client = Object.values(apiKeys).filter((client) => typeof client === 'object').find((client) => client.apiKey === key);
        if (!client) {
            throw new Error('Client not found');
        }
        return client;
    }
}
