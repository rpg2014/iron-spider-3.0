import * as cdk from "aws-cdk-lib";

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { generateKeyPairSync } from "crypto";
import { SecretValue } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import fs from "node:fs";
import path from "node:path";
import { AttributeType, BillingMode, ProjectionType, Table } from "aws-cdk-lib/aws-dynamodb";
import { KeyPairSyncResult } from "node:crypto";

type PasskeyInfraProps = {
  userTableName: string;
  credentialsTableName: string;
  operationsAccess: NodejsFunction[];
  sesArns: string[];
};

const defaultAutoScalingOptions = {
  minCapacity: 1,
  maxCapacity: 5,
};

export class PasskeyInfraStack extends cdk.Stack {
  public UserTable: Table;
  public CredentialTable: Table;
  public rsaSecret: Secret;
  public AuthorizationsTable: Table;
  public AuthorizationsTableByAuthCodeIndexName = "OAuthAuthorizationsTableByAuthCodeV2";
  public AuthorizationsTableByRefreshTokenIndexName = "OAuthAuthorizationsTableByRefreshTokenV2";
  public AuthorizationsTableByAccessTokenIndexName = "OAuthAuthorizationsTableByAccessTokenV2";
  public AuthorizationsTableByUserIndexName = "OAuthAuthorizationsTableByUserIdV2";
  // public role;
  constructor(scope: Construct, id: string, props: cdk.StackProps & PasskeyInfraProps) {
    super(scope, id, props);

    // set up user table
    this.UserTable = new Table(this, id + props.userTableName + "Table", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // set up credential table and secondary index
    this.CredentialTable = new Table(this, id + props.credentialsTableName + "Table", {
      partitionKey: { name: "credentialID", type: AttributeType.STRING },
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });
    const userIndexName = props.credentialsTableName + "ByUser";
    this.CredentialTable.addGlobalSecondaryIndex({
      indexName: userIndexName,
      partitionKey: { name: "userID", type: AttributeType.STRING },
      sortKey: { name: "credentialID", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
      readCapacity: 1,
      writeCapacity: 1,
    });
    this.CredentialTable.autoScaleReadCapacity(defaultAutoScalingOptions);
    this.CredentialTable.autoScaleWriteCapacity(defaultAutoScalingOptions);
    this.CredentialTable.autoScaleGlobalSecondaryIndexReadCapacity(userIndexName, defaultAutoScalingOptions);
    this.CredentialTable.autoScaleGlobalSecondaryIndexWriteCapacity(userIndexName, defaultAutoScalingOptions);

    // OAuth Authorizations Table
    this.AuthorizationsTable = new Table(this, "OAuthAuthorizationsTable", {
      // auth id or user id? idk yet
      partitionKey: { name: "authorizationId", type: AttributeType.STRING },
      sortKey: { name: "userId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    this.AuthorizationsTable.addGlobalSecondaryIndex({
      indexName: this.AuthorizationsTableByAuthCodeIndexName,
      partitionKey: { name: "authCode", type: AttributeType.STRING },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: ["clientId", "userId", "scopes", "authCodeInfo", "created", "codeChallenge", "codeChallengeMethod", "lastUpdatedDate"],
    });
    // get by refresh token
    this.AuthorizationsTable.addGlobalSecondaryIndex({
      indexName: this.AuthorizationsTableByRefreshTokenIndexName,
      partitionKey: { name: "refreshToken", type: AttributeType.STRING },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: ["clientId", "userId", "refreshTokenInfo", "created", "lastUpdatedDate"],
    });
    this.AuthorizationsTable.addGlobalSecondaryIndex({
      indexName: this.AuthorizationsTableByAccessTokenIndexName,
      partitionKey: { name: "accessToken", type: AttributeType.STRING },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: ["clientId", "userId", "accessTokenInfo", "scopes", "created", "lastUpdatedDate"],
    });
    this.AuthorizationsTable.addGlobalSecondaryIndex({
      indexName: this.AuthorizationsTableByUserIndexName,
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "clientId", type: AttributeType.STRING },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: ["clientId", "userId", "scopes", "created", "lastUpdatedDate"],
    });

    props.operationsAccess.forEach(operation => this.UserTable.grantReadWriteData(operation));
    props.operationsAccess.forEach(operation => this.CredentialTable.grantReadWriteData(operation));
    props.operationsAccess.forEach(operation => this.AuthorizationsTable.grantReadWriteData(operation));

    //Secrets
    //generate RSA key
    const getKeyPair = () => {
      //Make this function generate a keyfile with both the keys in it if it doesn't already exist.  if it does just return the file's data
      if (!fs.existsSync(path.resolve(__dirname, "../.keypair.json"))) {
        const keypair: KeyPairSyncResult<string, string> = generateKeyPairSync("rsa", {
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
        // hash pub key and take first 8
        const keyId = keypair.publicKey
          .replace(/-----BEGIN PUBLIC KEY-----/, "")
          .replace(/-----END PUBLIC KEY-----/, "")
          .replace(/\n/g, "")
          .slice(0, 8);
        fs.writeFileSync(path.resolve(__dirname, "../.keypair.json"), JSON.stringify({...keypair, keyId }, null, 2));
      }
      return JSON.parse(fs.readFileSync(path.resolve(__dirname, "../.keypair.json"), "utf-8"));
    };
    const keyPair = getKeyPair();
    this.rsaSecret = new Secret(this, id + "VerificationCodeKey", {
      secretName: id + "VerificationCodeKey",
      secretObjectValue: {
        publicKey: SecretValue.unsafePlainText(keyPair.publicKey),
        privateKey: SecretValue.unsafePlainText(keyPair.privateKey),
        keyId: SecretValue.unsafePlainText(keyPair.keyId),
      },
    });
    //TODO: later pull in the auth api's into this stack, but then provide their api def into the api stack and merge
    props.operationsAccess.forEach(operation => this.rsaSecret.grantRead(operation));

    props.operationsAccess.forEach(operation =>
      operation.addToRolePolicy(
        new PolicyStatement({
          actions: ["ses:SendEmail"],
          resources: [...props.sesArns],
        }),
      ),
    );

    //TODO: create rotation lambda
    // this.rsaSecret.addRotationSchedule(id+"VerficationCodeKeyRotation", {
    //     rotationLambda: //TODO
    // })
    //outputs for use in functions
    props.operationsAccess
      // .filter(operation => operation.functionName.includes("CreateUser"))
      .forEach(op => {
        op.addEnvironment("VERIFICATION_SECRET_ARN", this.rsaSecret.secretArn);
        op.addEnvironment("USER_TABLE_NAME", this.UserTable.tableName);
        op.addEnvironment("CREDENTIALS_TABLE_NAME", this.CredentialTable.tableName);
        op.addEnvironment("CREDENTIALS_BY_USER_INDEX_NAME", userIndexName);
        op.addEnvironment("AUTHORIZATIONS_TABLE_NAME", this.AuthorizationsTable.tableName);
        op.addEnvironment("AUTHORIZATIONS_BY_AUTH_CODE_INDEX_NAME", this.AuthorizationsTableByAuthCodeIndexName);
        op.addEnvironment("AUTHORIZATIONS_BY_REFRESH_TOKEN_INDEX_NAME", this.AuthorizationsTableByRefreshTokenIndexName);
        op.addEnvironment("AUTHORIZATIONS_BY_ACCESS_TOKEN_INDEX_NAME", this.AuthorizationsTableByAccessTokenIndexName);
        op.addEnvironment("AUTHORIZATIONS_BY_USER_INDEX_NAME", this.AuthorizationsTableByUserIndexName);
      });
  }
}
