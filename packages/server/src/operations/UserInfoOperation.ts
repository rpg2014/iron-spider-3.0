import { Operation } from "@aws-smithy/server-common";
import { GetJwksOutput, GetPublicKeysOutput, UserInfoOutput } from "iron-spider-ssdk";
import { createPublicKey } from "node:crypto";
import { getSecretKeyAccessor, getUserAccessor } from "src/accessors/AccessorFactory";
import { HandlerContext } from "src/model/common";
import { base64UrlEncode } from "src/util";

export const UserInfo: Operation<{}, UserInfoOutput, HandlerContext> = async (input, context) => {
  console.log("Got context", context);
  if (context.userId) {
    const response: UserInfoOutput = {
      verified: true,
      userId: context.userId,
      displayName: context.displayName,
      siteAccess: context.siteAccess?.split(","),
      apiAccess: context.apiAccess?.split(","),
      tokenExpiry: context.tokenExpiry ? new Date(Number.parseInt(context.tokenExpiry) * 1000) : new Date(),
      credentials: (await getUserAccessor().getUser(context.userId)).credentials?.map(cred => cred.toString()),
    } as UserInfoOutput;
    console.log("response, ", response);
    return response;
  } else {
    console.log("No userId present in auth context");
    return {
      verified: false,
    };
  }
};

export const GetPublicKeys: Operation<{}, GetPublicKeysOutput, HandlerContext> = async (input, context) => {
  return {
    keys: [(await getSecretKeyAccessor().getKey()).publicKey],
  };
};
export const GetJwks: Operation<{}, GetJwksOutput, HandlerContext> = async (input, context) => {
  // convert PEM to JWK
  const keypair = await getSecretKeyAccessor().getKey();
  const pubKey = createPublicKey(keypair.publicKey);
  const jwk = pubKey.export({ format: "jwk" });
  // Extract the required components
  const { n, e } = jwk as { n: string; e: string };

  return {
    keys: [
      {
        kty: "RSA",
        use: "sig",
        kid: keypair.keyId ?? base64UrlEncode(Buffer.from(pubKey.export({ format: "der", type: "spki" })).subarray(0, 8)),
        n,
        e,
        alg: "RS256", // Assuming RS256 algorithm, adjust if needed
      },
    ],
  };
};
