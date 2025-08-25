import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { BuildSpec, Project } from 'aws-cdk-lib/aws-codebuild';
import { SnsTopic } from 'aws-cdk-lib/aws-events-targets';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Schedule, ScheduleExpression } from 'aws-cdk-lib/aws-scheduler';
import { CodeBuildStartBuild } from 'aws-cdk-lib/aws-scheduler-targets';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { NagSuppressions } from 'cdk-nag';
import { Region } from '../utils/enums';

const projectName = 'garbage-collection';

export class GarbageCollectionStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { email: string }) {
    super(scope, id, props);

    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/codebuild/${projectName}`,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const topic = new Topic(this, 'Topic', {
      topicName: projectName,
      enforceSSL: true,
    });

    topic.addSubscription(new EmailSubscription(props.email));

    const project = new Project(this, 'Project', {
      projectName,
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['npm install -g aws-cdk'],
          },
          build: {
            commands: [
              Region.EU_WEST_1,
              Region.US_EAST_1,
            ].map(region => `cdk gc aws://${this.account}/${region} --unstable=gc --confirm=false --created-buffer-days=0`),
          },
        },
      }),
      logging: { cloudWatch: { logGroup } },
      timeout: Duration.minutes(5),
      concurrentBuildLimit: 1,
    });

    NagSuppressions.addResourceSuppressions(project, [{
      id: 'AwsSolutions-CB4',
      reason: 'AWS managed encryption is sufficient',
    }]);

    this.addPolicyStatements(project, Region.EU_WEST_1);
    this.addPolicyStatements(project, Region.US_EAST_1);

    project.onBuildFailed('BuildFailed', {
      target: new SnsTopic(topic),
    });

    new Schedule(this, 'Schedule', {
      scheduleName: projectName,
      schedule: ScheduleExpression.rate(Duration.days(1)),
      target: new CodeBuildStartBuild(project),
    });
  }

  private addPolicyStatements(project: Project, region: Region): void {
    project.addToRolePolicy(
      new PolicyStatement({
        actions: ['cloudformation:DescribeStacks'],
        resources: [`arn:aws:cloudformation:${region}:${this.account}:stack/CDKToolkit/*`],
      }),
    );

    project.addToRolePolicy(
      new PolicyStatement({
        actions: ['cloudformation:ListStacks', 'cloudformation:GetTemplateSummary', 'cloudformation:GetTemplate'],
        resources: [`arn:aws:cloudformation:${region}:${this.account}:stack/*/*`],
      }),
    );

    const bucket = Bucket.fromBucketName(this, `Bucket-${region}`, `cdk-hnb659fds-assets-${this.account}-${region}`);
    bucket.grantReadWrite(project);

    project.addToRolePolicy(
      new PolicyStatement({
        actions: ['ecr:ListImages', 'ecr:DescribeImages', 'ecr:BatchGetImage', 'ecr:BatchDeleteImage'],
        resources: [`arn:aws:ecr:${region}:${this.account}:repository/cdk-hnb659fds-container-assets-${this.account}-${region}`],
      }),
    );

    NagSuppressions.addResourceSuppressions(project.role!, [{
      id: 'AwsSolutions-IAM5',
      reason: 'The project needs to access CloudFormation, S3 and ECR resources',
    }], true);
  }
}
