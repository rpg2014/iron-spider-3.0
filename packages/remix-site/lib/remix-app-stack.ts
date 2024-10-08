import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, CacheControl, Source } from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";
import type { StackProps } from "aws-cdk-lib";
import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import { LogLevel, NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { HttpOrigin, S3BucketOrigin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import type { EdgeLambda } from "aws-cdk-lib/aws-cloudfront";
import {
  AccessLevel,
  AllowedMethods,
  CachePolicy,
  Distribution,
  HttpVersion,
  LambdaEdgeEventType,
  OriginAccessIdentity,
  OriginRequestCookieBehavior,
  OriginRequestHeaderBehavior,
  OriginRequestPolicy,
  OriginRequestQueryStringBehavior,
  PriceClass,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import type { FunctionUrl } from "aws-cdk-lib/aws-lambda";
import { Code, FunctionUrlAuthType, InvokeMode, Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import path from "path";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { AaaaRecord, ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

type RemixAppStackProps = {
  env?: any;
  computeType?: "EdgeFunction"; //| "HTTPStreaming",
  certificateArn: string;
  domainName: string;
  subDomain: string;
};
export class RemixAppStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & RemixAppStackProps) {
    super(scope, id, props);

    //Was attempting to support http streams, but AWS only supports them as lambda function URL's
    // which you cannot put behind a CDN or route 53, so it doesn't work currently. (you'll just need to fix the distribution)
    const isStreamingFunction = props.computeType !== "EdgeFunction";
    if (isStreamingFunction) {
      throw new Error("Streaming functions not supported yet");
    }

    //
    const assetsBucket = new Bucket(this, "AssetsBucket", {
      autoDeleteObjects: true,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    //service worker bucket, needed for separate cache control
    const serviceWorkerBucket = new Bucket(this, "ServiceWorkerBucket", {
      autoDeleteObjects: true,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // set up cloudfront origins for the s3 buckets with read permissions
    const assetsBucketS3Origin = S3BucketOrigin.withOriginAccessControl(assetsBucket, {
      originAccessLevels: [AccessLevel.READ],
    });

    const serviceWorkerBucketS3Origin = S3BucketOrigin.withOriginAccessControl(serviceWorkerBucket, {
      originAccessLevels: [AccessLevel.READ],
    });

    const fn = new NodejsFunction(this, "RemixServerFn", {
      currentVersionOptions: {
        removalPolicy: RemovalPolicy.DESTROY,
      },
      code: Code.fromAsset(path.join(__dirname, "../dist/")),
      handler: isStreamingFunction ? "streamingHandler" : "lambda_server.nonStreamingHandler",
      logRetention: RetentionDays.THREE_DAYS,
      memorySize: 256,
      timeout: Duration.seconds(10),
      runtime: Runtime.NODEJS_20_X,
      // tracing: Tracing.ACTIVE, // not supported on Lambda@Edge
    });

    fn.role?.addManagedPolicy({
      managedPolicyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
    });

    // The only way to interact with http streams is lambda function urls, which you cannot put behind a CDN, and route 53,
    // so i'm not going to bother right now.
    let url: FunctionUrl | null = null;
    if (isStreamingFunction) {
      url = fn.addFunctionUrl({
        invokeMode: InvokeMode.RESPONSE_STREAM,
        authType: FunctionUrlAuthType.NONE,
      });
    }

    const distribution = new Distribution(this, id + "Distribution", {
      certificate: Certificate.fromCertificateArn(this, "certArn", props.certificateArn),
      enableLogging: false,
      domainNames: [`${props.subDomain}.${props.domainName}`],
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_100,
      // Default behavior, all requests get handled by edge function, with the fall through origin as s3.
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        compress: true,
        edgeLambdas: !isStreamingFunction
          ? [
              {
                eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
                functionVersion: fn.currentVersion,
                includeBody: true,
              } as EdgeLambda,
            ]
          : undefined,

        origin:
          isStreamingFunction && url
            ? new HttpOrigin(url.url.replace("https://", ""), {
                originId: "StreamingFnOriginId",
              })
            : assetsBucketS3Origin,
        originRequestPolicy: new OriginRequestPolicy(this, "OriginRequestPolicy", {
          headerBehavior: OriginRequestHeaderBehavior.all(),
          queryStringBehavior: OriginRequestQueryStringBehavior.all(),
          cookieBehavior: OriginRequestCookieBehavior.all(),
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      // Static assets are retrieved from the /assets path.
      additionalBehaviors: {
        "assets/*": {
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: CachePolicy.CACHING_OPTIMIZED,
          compress: true,
          origin: assetsBucketS3Origin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        "/sw.js": {
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: CachePolicy.CACHING_DISABLED, // might change
          compress: true,
          origin: serviceWorkerBucketS3Origin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        "static/*": {
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: CachePolicy.CACHING_OPTIMIZED,
          compress: true,
          origin: serviceWorkerBucketS3Origin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
    });

    // Deploy the local code to S3
    new BucketDeployment(this, id + "AssetsDeployment", {
      destinationBucket: assetsBucket,
      distribution,
      prune: true,
      sources: [Source.asset(path.join(__dirname, "../build/client"))],
      cacheControl: [CacheControl.maxAge(Duration.days(365)), CacheControl.sMaxAge(Duration.days(365))],
    });

    // deploy SW to S3, with no cache
    new BucketDeployment(this, id + "SWDeployment", {
      destinationBucket: serviceWorkerBucket,
      distribution,
      prune: true,
      sources: [Source.asset(path.join(__dirname, "../build/client/otherAssets"))],
      cacheControl: [CacheControl.noCache(), CacheControl.noStore()],
      distributionPaths: ["/sw.js", "/static"],
    });

    const hostedZone = HostedZone.fromLookup(this, "DomainHostedZone", {
      domainName: props.domainName,
    });

    new ARecord(this, id + "ARecord", {
      zone: hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      recordName: `${props.subDomain}.${props.domainName}`,
      // if the deploy fails b/c the record already exists, uncomment the below line
      // deleteExisting: true,
    });
    new AaaaRecord(this, id + "AAAARecord", {
      recordName: `${props.subDomain}.${props.domainName}`,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      // if the deploy fails b/c the record already exists, uncomment the below line
      // deleteExisting: true,
    });
  }
}
