
import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';


type PasskeyInfraProps = {
    userTableName: string,
    credentialsTableName: string,
    operationsAccess: NodejsFunction[],
}

const defaultAutoScalingOptions = {
    minCapacity: 1,
    maxCapacity: 5,
  }


export class PasskeyInfraStack extends cdk.Stack {
    public UserTable;
    public CredentialTable;
    // public role;
    constructor(scope: Construct, id: string, props: cdk.StackProps & PasskeyInfraProps) {
      super(scope, id, props);

      // set up user table
      this.UserTable = new ddb.Table(this, props.userTableName, {
        partitionKey: {name: "id", type: ddb.AttributeType.STRING},
        billingMode: ddb.BillingMode.PAY_PER_REQUEST
      })
      

      // set up credential table and secondary index
      this.CredentialTable = new ddb.Table(this, props.credentialsTableName, {
        partitionKey: {name: "credentialID", type: ddb.AttributeType.STRING},
        billingMode: ddb.BillingMode.PROVISIONED,
        readCapacity: 1,
        writeCapacity: 1,
      }); 
      const userIndexName = props.credentialsTableName+"ByUser";
      this.CredentialTable.addGlobalSecondaryIndex({
        indexName: userIndexName,
        partitionKey: {name: "userID", type: ddb.AttributeType.STRING},
        sortKey: {name: "credentialID", type: ddb.AttributeType.STRING},
        projectionType: ddb.ProjectionType.ALL,
        readCapacity: 1,
        writeCapacity: 1,
      })
      this.CredentialTable.autoScaleReadCapacity(defaultAutoScalingOptions)
      this.CredentialTable.autoScaleWriteCapacity(defaultAutoScalingOptions)
      this.CredentialTable.autoScaleGlobalSecondaryIndexReadCapacity(userIndexName, defaultAutoScalingOptions)
      this.CredentialTable.autoScaleGlobalSecondaryIndexWriteCapacity(userIndexName, defaultAutoScalingOptions)


      props.operationsAccess.forEach((operation)=> this.UserTable.grantReadWriteData(operation))
      props.operationsAccess.forEach((operation)=> this.CredentialTable.grantReadWriteData(operation))


    }

}