import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { generateKeyPairSync } from "crypto";
import { createSign, createVerify } from "crypto";

const client = new SecretsManagerClient();

interface RotationEvent {
  SecretId: string;
  Token: string;
  Step: "createSecret" | "setSecret" | "testSecret" | "finishSecret";
}

interface KeyPairSecret {
  publicKey: string;
  privateKey: string;
  keyId: string;
}

export const handler = async (event: RotationEvent): Promise<void> => {
  const { SecretId, Token, Step } = event;
  
  console.log(`Starting rotation step: ${Step} for secret: ${SecretId}`);

  try {
    switch (Step) {
      case "createSecret":
        await createSecret(SecretId, Token);
        break;
      case "setSecret":
        await setSecret(SecretId, Token);
        break;
      case "testSecret":
        await testSecret(SecretId, Token);
        break;
      case "finishSecret":
        await finishSecret(SecretId, Token);
        break;
      default:
        throw new Error(`Invalid step: ${Step}`);
    }
    
    console.log(`Successfully completed step: ${Step}`);
  } catch (error) {
    console.error(`Error during step ${Step}:`, error);
    throw error;
  }
};

/**
 * Creates a new RSA keypair and stores it with AWSPENDING label
 */
async function createSecret(secretId: string, token: string): Promise<void> {
  // Check if version already exists
  try {
    await client.send(new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: token,
      VersionStage: "AWSPENDING"
    }));
    console.log("Secret version already exists, skipping creation");
    return;
  } catch (error) {
    // Version doesn't exist, continue with creation
  }

  // Generate new RSA keypair
  const keypair = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
  });

  // Generate keyId from public key
  const keyId = keypair.publicKey
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\n/g, "")
    .slice(0, 8);

  const secretValue: KeyPairSecret = {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey,
    keyId: keyId
  };

  // Store the new secret with AWSPENDING label
  await client.send(new PutSecretValueCommand({
    SecretId: secretId,
    ClientRequestToken: token,
    SecretString: JSON.stringify(secretValue),
    VersionStages: ["AWSPENDING"]
  }));

  console.log("New keypair created and stored with AWSPENDING label");
}

/**
 * Optional: Perform any setup needed for the new secret
 * For RSA keys, usually no external setup is needed
 */
async function setSecret(secretId: string, token: string): Promise<void> {
  // For RSA keypairs, no external service configuration is needed
  // This step is required by the rotation framework but can be a no-op
  console.log("SetSecret step - no action needed for RSA keypair");
}

/**
 * Test the new secret to ensure it's valid
 */
async function testSecret(secretId: string, token: string): Promise<void> {
  // Retrieve the pending secret
  const response = await client.send(new GetSecretValueCommand({
    SecretId: secretId,
    VersionId: token,
    VersionStage: "AWSPENDING"
  }));

  if (!response.SecretString) {
    throw new Error("Secret string is empty");
  }

  const secret: KeyPairSecret = JSON.parse(response.SecretString);

  // Validate the secret structure
  if (!secret.publicKey || !secret.privateKey || !secret.keyId) {
    throw new Error("Invalid secret structure - missing required keys");
  }

  try {
    // Create a test signature with private key
    const testData = "rotation-test-data";
    const sign = createSign("RSA-SHA256");
    sign.update(testData);
    const signature = sign.sign(secret.privateKey, "base64");

    // Verify with public key
    const verify = createVerify("RSA-SHA256");
    verify.update(testData);
    const isValid = verify.verify(secret.publicKey, signature, "base64");

    if (!isValid) {
      throw new Error("Keypair validation failed - signature verification failed");
    }

    console.log("Keypair validation successful");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Keypair validation failed: ${errorMessage}`);
  }
}

/**
 * Move the AWSCURRENT label to the new version
 */
async function finishSecret(secretId: string, token: string): Promise<void> {
  // Get current version
  const currentResponse = await client.send(new GetSecretValueCommand({
    SecretId: secretId,
    VersionStage: "AWSCURRENT"
  }));

  // Get pending version secret
  const pendingResponse = await client.send(new GetSecretValueCommand({
    SecretId: secretId,
    VersionId: token,
    VersionStage: "AWSPENDING"
  }));

  // Move AWSCURRENT to new version
  await client.send(new PutSecretValueCommand({
    SecretId: secretId,
    ClientRequestToken: token,
    SecretString: pendingResponse.SecretString,
    VersionStages: ["AWSCURRENT"]
  }));

  console.log(`Rotation completed - version ${token} is now AWSCURRENT`);
}