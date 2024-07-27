import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { CfnAccessKey, Policy, PolicyStatement, User } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface IAWSUserAccount {
  
  policy: Policy;
}

export class AWSUserAccount extends Construct implements IAWSUserAccount {
  policy: Policy;
  user: User

  constructor(scope: Construct, id: string, props: IAWSUserAccount) {
      super(scope, id);

      //create user
      this.user = new User(this, `${id}User`)
      this.policy = props.policy
      this.user.attachInlinePolicy(props.policy)
  
      const accessKey = new CfnAccessKey(this, id+'AccessKey', {
        userName: this.user.userName,
      });
 
      new CfnOutput(this, `${id}accessKeyId`, { value: accessKey.ref });
      new CfnOutput(this, id+'secretAccessKey', { value: accessKey.attrSecretAccessKey });
  }
    

  
}
