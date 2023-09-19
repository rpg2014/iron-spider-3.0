import { SecretKeyAccessor } from "./AccessorInterfaces";
import { SecretsManagerClient, GetSecretValueRequest, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};
export class SecretsManagerSecretKeyAccessor extends SecretKeyAccessor {
  private client: SecretsManagerClient;
  private keyPair: KeyPair | undefined;

  constructor() {
    super();
    this.client = new SecretsManagerClient();
    this.keyPair = undefined;
  }

  public async getKey(): Promise<KeyPair> {
    if (!this.keyPair) {
      const input: GetSecretValueRequest = {
        SecretId: process.env.VERIFICATION_SECRET_ARN,
      };
      const response = await this.client.send(new GetSecretValueCommand(input));
      if (response.SecretString) {
        this.keyPair = JSON.parse(response.SecretString);
      } else {
        throw Error("Unable to fetch secret: " + process.env.VERIFICATION_SECRET_ARN);
      }
    }
    if (this.keyPair) {
      return this.keyPair;
    } else {
      throw Error("no keypair");
    }
  }
}
