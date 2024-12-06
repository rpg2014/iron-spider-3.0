
/**@internal */
export type KeyPair = {
  publicKey: string;
  privateKey: string;
};
/**@internal */
export abstract class SecretKeyAccessor {
  abstract getKey(): Promise<KeyPair>;
}

