import { Stage, StageProps, Environment } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkLambdaCanaryStack } from './cdk-lambda-canary-stack';

interface DeployStageProps extends StageProps {
  environmentType: string;
}

export class DeployStage extends Stage {
  public readonly stack: CdkLambdaCanaryStack;

  constructor(scope: Construct, id: string, props: DeployStageProps) {
    super(scope, id, props);

    this.node.setContext('environmentType', props.environmentType);
    const environmentType = this.node.tryGetContext('environmentType');
    const context = this.node.tryGetContext(environmentType);
    const stackName = this.node.tryGetContext('prefix');

    this.stack = new CdkLambdaCanaryStack(this, stackName, {
      env: {
        account: this.account,
        region: this.region,
      },
    });
  }
}
