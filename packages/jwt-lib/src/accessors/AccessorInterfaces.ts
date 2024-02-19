
export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export abstract class SecretKeyAccessor {
  abstract getKey(): Promise<KeyPair>;
}

