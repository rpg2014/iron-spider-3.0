import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { CfnAccessKey, Effect, Policy, PolicyDocument, PolicyStatement, User } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { AWSUserAccount  } from './aws-user-account';
import { getPolicies } from './policies';

export class HomelabStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps ) {
    super(scope, id, props)
    //IAM policy to allow traefik to do dns verification with route53
    const policies = getPolicies(this);
    const traefikUser = new AWSUserAccount(this, "Traefik", {
      policy: policies.traefik
    })
    const grafanaUser = new AWSUserAccount(this, "Grafana", {
      policy: policies.grafana
    })
  }
}
