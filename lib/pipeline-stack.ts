import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
  CodeBuildStep,
} from 'aws-cdk-lib/pipelines';
import {
  BuildEnvironment,
  LinuxBuildImage,
  ComputeType,
} from 'aws-cdk-lib/aws-codebuild';
import { DeployStage } from './deploy-stage';

export class PipelineStack extends Stack {
  private sourceStage: CodePipelineSource;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let environmentType = this.node.tryGetContext('environmentType') as string;
    if (!environmentType) {
      environmentType = 'qa';
    }

    const context = this.node.tryGetContext(environmentType);

    // GitHub repository info from context
    const owner = context.repository.owner;
    const repo = context.repository.repo;
    const branch = context.repository.branch;

    this.sourceStage = CodePipelineSource.gitHub(`${owner}/${repo}`, branch);
    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: context.pipeline.name,
      synth: new ShellStep('Synth', {
        input: this.sourceStage,
        env: {
          ENV_TYPE: environmentType,
        },
        installCommands: [
          'npm install -g aws-cdk',
          'npm ci', // install dependencies via package-lock.json
          'npm run build', // transpile TypeScript
          'ACCOUNT=$(aws sts get-caller-identity | jq -r .Account)',
        ],
        commands: [
          'cdk synth -c account=$ACCOUNT -c environmentType=$ENV_TYPE',
        ],
      }),
    });

    const qualitySteps = this.createCodeQualitySteps();

    pipeline.addStage(
      new DeployStage(this, 'QA', {
        environmentType: 'qa',
      }),
      {
        pre: qualitySteps,
      }
    );
  }

  private createCodeQualitySteps(): CodeBuildStep[] {
    const steps: CodeBuildStep[] = [];

    const environment: BuildEnvironment = {
      buildImage: LinuxBuildImage.STANDARD_7_0,
      computeType: ComputeType.SMALL,
      privileged: true,
    };

    steps.push(
      new CodeBuildStep('GitSecrets', {
        input: this.sourceStage,
        buildEnvironment: environment,
        projectName: 'cdk-pipelines-git-secrets',
        installCommands: [
          'SECRETS_FOLDER=git-secrets',
          'mkdir $SECRETS_FOLDER',
          'git clone --quiet https://github.com/awslabs/git-secrets.git $SECRETS_FOLDER',
          'cd $SECRETS_FOLDER',
          'make install',
          'cd .. && rm -rf $SECRETS_FOLDER',
        ],
        commands: [
          'git secrets --register-aws',
          'git secrets --scan',
          'echo No vulnerabilities detected. Have a really nice day!',
        ],
      })
    );

    return steps;
  }
}
