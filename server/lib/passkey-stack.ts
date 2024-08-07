import * as cdk from "aws-cdk-lib";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { generateKeyPairSync } from "crypto";
import { SecretValue } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import fs from "node:fs";
import path from "node:path";

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
  public UserTable: ddb.Table;
  public CredentialTable: ddb.Table;
  public rsaSecret: Secret;
  // public role;
  constructor(scope: Construct, id: string, props: cdk.StackProps & PasskeyInfraProps) {
    super(scope, id, props);

    // set up user table
    this.UserTable = new ddb.Table(this, id + props.userTableName + "Table", {
      partitionKey: { name: "id", type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });

    // set up credential table and secondary index
    this.CredentialTable = new ddb.Table(this, id + props.credentialsTableName + "Table", {
      partitionKey: { name: "credentialID", type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });
    const userIndexName = props.credentialsTableName + "ByUser";
    this.CredentialTable.addGlobalSecondaryIndex({
      indexName: userIndexName,
      partitionKey: { name: "userID", type: ddb.AttributeType.STRING },
      sortKey: { name: "credentialID", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
      readCapacity: 1,
      writeCapacity: 1,
    });
    this.CredentialTable.autoScaleReadCapacity(defaultAutoScalingOptions);
    this.CredentialTable.autoScaleWriteCapacity(defaultAutoScalingOptions);
    this.CredentialTable.autoScaleGlobalSecondaryIndexReadCapacity(userIndexName, defaultAutoScalingOptions);
    this.CredentialTable.autoScaleGlobalSecondaryIndexWriteCapacity(userIndexName, defaultAutoScalingOptions);

    props.operationsAccess.forEach(operation => this.UserTable.grantReadWriteData(operation));
    props.operationsAccess.forEach(operation => this.CredentialTable.grantReadWriteData(operation));

    //Secrets
    //generate RSA key
    const getKeyPair = () => {
      //Make this function generate a keyfile with both the keys in it if it doesn't already exist.  if it does just return the file's data
      if (!fs.existsSync(path.resolve(__dirname, "../.keypair.json"))) {
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
        fs.writeFileSync(path.resolve(__dirname, "../.keypair.json"), JSON.stringify(keypair, null, 2));
      }
      return JSON.parse(fs.readFileSync(path.resolve(__dirname, "../.keypair.json"), "utf-8"));
    };
    const keyPair = getKeyPair();
    this.rsaSecret = new Secret(this, id + "VerificationCodeKey", {
      secretName: id + "VerificationCodeKey",
      secretObjectValue: {
        publicKey: SecretValue.unsafePlainText(keyPair.publicKey),
        privateKey: SecretValue.unsafePlainText(keyPair.privateKey),
      },
    });
    //TODO: later pull in the auth api's into this stack, but then provide their api def into the api stack and merge
    props.operationsAccess.forEach(operation => this.rsaSecret.grantRead(operation));

    props.operationsAccess.forEach(operation =>
      operation.addToRolePolicy(
        new PolicyStatement({
          actions: ["ses:SendEmail"],
          resources: [...props.sesArns],
        })
      )
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
      });
  }
}
