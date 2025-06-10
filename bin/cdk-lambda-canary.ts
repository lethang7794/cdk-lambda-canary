#!/usr/bin/env node
import { App, Environment } from 'aws-cdk-lib';

import { PipelineStack } from '../lib/pipeline-stack';

// Initialize the CDK application
const app = new App();

// Retrieve deployment configuration from CDK context
const environmentType = app.node.tryGetContext('environmentType') || 'qa';
const environmentContext = app.node.tryGetContext(environmentType);

// Extract configuration values
const region: string = environmentContext.region;
const account: string = app.node.tryGetContext('account');

// Configure the deployment environment
const env: Environment | undefined =
  account && region ? { account: account, region: region } : undefined;

// Create the pipeline stack
new PipelineStack(app, 'cdk-workshop-cdk-pipeline-stack', {
  env: env,
});

// Synthesize the CloudFormation template
app.synth();
