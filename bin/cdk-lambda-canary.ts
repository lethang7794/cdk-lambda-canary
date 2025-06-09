#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkLambdaCanaryStack } from '../lib/cdk-lambda-canary-stack';

const app = new cdk.App();
new CdkLambdaCanaryStack(app, 'CdkLambdaCanaryStack');
