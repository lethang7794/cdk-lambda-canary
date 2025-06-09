import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Function,
  Runtime,
  Code,
  Alias,
  VersionOptions,
} from 'aws-cdk-lib/aws-lambda';
import { LambdaRestApi, StageOptions } from 'aws-cdk-lib/aws-apigateway';
import { Alarm, ComparisonOperator } from 'aws-cdk-lib/aws-cloudwatch';
import {
  LambdaDeploymentGroup,
  LambdaDeploymentConfig,
} from 'aws-cdk-lib/aws-codedeploy';

export class CdkLambdaCanaryStack extends Stack {
  private readonly aliasName: string;
  private readonly stageName: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const environmentType = this.node.tryGetContext('environmentType');
    const context = this.node.tryGetContext(environmentType);
    this.aliasName = context.lambda.alias;
    this.stageName = context.lambda.stage;

    const currentTime = new Date().toUTCString();

    const myLambda = new Function(this, 'MyFunction', {
      functionName: context.lambda.name,
      code: Code.fromAsset('lambda'),
      handler: 'handler.handler',
      runtime: Runtime.NODEJS_22_X,
      currentVersionOptions: {
        description: `Version deployed on ${currentTime}`,
        removalPolicy: RemovalPolicy.RETAIN,
      } as VersionOptions,
    });

    const newVersion = myLambda.currentVersion;
    newVersion.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const alias = new Alias(this, 'FunctionAlias', {
      aliasName: this.aliasName,
      version: newVersion,
    });

    new LambdaRestApi(this, 'RestAPI', {
      handler: alias,
      deployOptions: {
        stageName: this.stageName,
      } as StageOptions,
    });

    const failureAlarm = new Alarm(this, 'FunctionFailureAlarm', {
      metric: alias.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'The latest deployment errors > 0',
      alarmName: `${this.stackName}-canary-alarm`,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    new LambdaDeploymentGroup(this, 'CanaryDeployment', {
      alias: alias,
      deploymentConfig: LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
      alarms: [failureAlarm],
    });
  }
}
