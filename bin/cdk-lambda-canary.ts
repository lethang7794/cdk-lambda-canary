#!/usr/bin/env node
import { App, Environment, Tags } from 'aws-cdk-lib';
import { CdkLambdaCanaryStack } from '../lib/cdk-lambda-canary-stack';

// Initialize the CDK application
const app = new App();

// Retrieve deployment configuration from CDK context
const environmentType = app.node.tryGetContext('environmentType');
const environmentContext = app.node.tryGetContext(environmentType);

// Extract configuration values
const region: string = environmentContext.region;
const account: string = app.node.tryGetContext('account');
const tags: { [key: string]: string } = environmentContext.tags || {};
const stackName = `${app.node.tryGetContext('prefix')}-${environmentType}`;

// Configure the deployment environment
const env: Environment = {
  account: account || process.env.CDK_DEFAULT_ACCOUNT,
  region: region || process.env.CDK_DEFAULT_REGION,
};

// Initialize the CDK stack with the specified environment
const stack = new CdkLambdaCanaryStack(app, stackName, {
  env,
  description: `Lambda Canary Deployment Stack for ${environmentType} environment`,
});

// Apply tags to all taggable resources in the stack
for (const [key, value] of Object.entries(tags)) {
  if (value) {
    // Only add non-empty tags
    Tags.of(stack).add(key, value);
  }
}

// Synthesize the CloudFormation template
app.synth();
