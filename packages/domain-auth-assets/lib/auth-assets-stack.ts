import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { ARecord, AaaaRecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import {
  AccessLevel,
  AllowedMethods,
  Distribution,
  Function,
  FunctionCode,
  FunctionEventType,
  HttpVersion,
  PriceClass,
  ResponseHeadersPolicy,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

export interface IDomainAuthSiteProps {
  domainName: string;
  subDomain: string;
  certificateArn: string;
}

/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */
export class DomainAuthAssetsStack extends Stack {
  constructor(parent: any, name: string, props: StackProps & IDomainAuthSiteProps) {
    super(parent, name, props);

    const zone = HostedZone.fromLookup(this, "DomainHostedZone", {
      domainName: props.domainName,
    });
    const siteDomain = props.subDomain + "." + props.domainName;

    new CfnOutput(this, "AuthSiteDomain", { value: "https://" + siteDomain });

    // Content bucket
    const siteBucket = new Bucket(this, `${name}SiteBucket`, {
      bucketName: siteDomain, //"IronSpider"+
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,

      /**
       * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
       */
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code

      /**
       * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
       * setting will enable full cleanup.
       */
      autoDeleteObjects: true, // NOT recommended for production code
    });

    // Grant access to cloudfront
    // siteBucket.addToResourcePolicy(
    //   new PolicyStatement({
    //     actions: ["s3:GetObject"],
    //     resources: [siteBucket.arnForObjects("*")],
    //     principals: [
    //       new CanonicalUserPrincipal(
    //         cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId,
    //       ),
    //     ],
    //   }),
    // );

    // Cloudfront function that will attach a .html to the end of paths in order to serve the ssr version of it
    // when that occurs remove the /index.html error response from the 403 error.
    const pathRewriteFunction = new Function(this, "PathRewriteFunction", {
      code: FunctionCode.fromFile({
        filePath: path.resolve(__dirname, "../cloudfrontFunction.js"),
      }),
    });
    const contentTypeAddingFunction = new Function(this, "ContentTypeAddingFunction", {
      code: FunctionCode.fromFile({
        filePath: path.resolve(__dirname, "../cloudfrontResponseFunction.js"),
      }),
    });
    // TODO: below
    //Should remove this at some point, initially was just for the openId connect response
    const policy = new ResponseHeadersPolicy(this, "SiteReponseHeadersPolicy", {
      corsBehavior: {
        accessControlAllowCredentials: false,
        accessControlAllowHeaders: ["*"],
        accessControlAllowMethods: ["GET", "OPTIONS"],
        accessControlAllowOrigins: ["*"],
        accessControlExposeHeaders: ["*"],
        originOverride: true,
      },
    })
    // CloudFront distribution
    const distribution = new Distribution(this, name + "SiteDistribution", {
      certificate: Certificate.fromCertificateArn(this, "certArn", props.certificateArn),
      defaultRootObject: "index.html",
      domainNames: [siteDomain],
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_100,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: "/index.html",
          // ttl: Duration.minutes(30),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(siteBucket, {
          originAccessLevels: [AccessLevel.READ],
        }),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy:{
          responseHeadersPolicyId: policy.responseHeadersPolicyId
        },
        functionAssociations: [
          {
            function: pathRewriteFunction,
            eventType: FunctionEventType.VIEWER_REQUEST,
          },
          {
            function: contentTypeAddingFunction,
            eventType: FunctionEventType.VIEWER_RESPONSE,
          }
        ],
      },
    });

    // Route53 alias record for the CloudFront distribution
    new ARecord(this, `${name}SiteAliasRecord`, {
      recordName: siteDomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone,
    });

    new AaaaRecord(this, `${name}SiteAAAAAliasRecord`, {
      recordName: siteDomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone,
    });

    // Deploy site contents to S3 bucket
    new BucketDeployment(this, "DeployWithInvalidation", {
      //TODO: Update
      sources: [Source.asset(path.resolve(__dirname, "../dist/static"))],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}
