import { BlockPublicAccess, Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { PhysicalName, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import { DataSource, IntendedUse, PlaceIndex } from "@aws-cdk/aws-location-alpha";

type InfraStackProps = {
  functionsForAccess: NodejsFunction[];
};

export class InfraStack extends Stack {
  public DateDDBTable: Table;
  public DateDDBTableByUserIndexName = "DateDDBTableByUserId";
  public PictureS3Bucket: Bucket;
  public DatePlacesIndex: PlaceIndex;
  public ConnectedUsersTable: Table;

  constructor(scope: Construct, id: string, props: StackProps & InfraStackProps) {
    super(scope, id, props);

    this.DateDDBTable = new Table(this, "DateDDBTable", {
      // tableName: "DateDDBTable",
      partitionKey: { name: "dateId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    this.DateDDBTable.addGlobalSecondaryIndex({
      indexName: this.DateDDBTableByUserIndexName,
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "dateId", type: AttributeType.STRING },
    });

    this.PictureS3Bucket = new Bucket(this, "DateTrackerPictureBucket", {
      // bucketName: "date-picture-bucket",
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    props.functionsForAccess.forEach(func => {
      this.DateDDBTable.grantReadWriteData(func);
      this.PictureS3Bucket.grantReadWrite(func);
    });

    this.DatePlacesIndex = new PlaceIndex(this, "DatePlacesIndex", {
      dataSource: DataSource.HERE,
      description: "Place index for use with the date tracker",
      intendedUse: IntendedUse.SINGLE_USE,
    });

    this.ConnectedUsersTable = new Table(this, "ConnectedUsersTable", {
      partitionKey: { name: "userId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
  }
}
