import * as path from 'node:path';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Architecture, LoggingFormat, Runtime, SystemLogLevel } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Schedule, ScheduleExpression } from 'aws-cdk-lib/aws-scheduler';
import { LambdaInvoke } from 'aws-cdk-lib/aws-scheduler-targets';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

const projectName = 'drift-detection';

export class DriftDetectionStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { email: string }) {
    super(scope, id, props);

    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: projectName,
      retention: RetentionDays.TWO_WEEKS,
    });

    const topic = new Topic(this, 'Topic', {
      topicName: projectName,
      enforceSSL: true,
    });

    topic.addSubscription(new EmailSubscription(props.email));
    topic.grantPublish(new ServicePrincipal('cloudwatch.amazonaws.com'));

    const handler = new NodejsFunction(this, 'DetectDrift', {
      functionName: projectName,
      entry: path.join(__dirname, '..', 'lambda', 'drift-detection', 'index.ts'),
      runtime: Runtime.NODEJS_24_X,
      logGroup,
      bundling: { minify: true },
      architecture: Architecture.ARM_64,
      systemLogLevelV2: SystemLogLevel.WARN,
      loggingFormat: LoggingFormat.JSON,
      timeout: Duration.minutes(1),
      environment: { TOPIC_ARN: topic.topicArn },
    });

    topic.grantPublish(handler);

    handler.addToRolePolicy(new PolicyStatement({
      actions: [
        'cloudformation:ListStacks',
        'cloudformation:DetectStackResourceDrift',
        'cloudformation:DetectStackDrift',
      ],
      resources: [
        `arn:aws:cloudformation:eu-west-1:${this.account}:stack/*/*`,
        `arn:aws:cloudformation:us-east-1:${this.account}:stack/*/*`,
      ],
    }));

    handler.addToRolePolicy(new PolicyStatement({
      actions: ['cloudformation:DescribeStackDriftDetectionStatus'],
      resources: ['*'],
    }));

    handler.metricErrors().createAlarm(this, `Alarm${handler.node.id}`, {
      alarmName: handler.functionName,
      threshold: 1,
      evaluationPeriods: 1,
    }).addAlarmAction(new SnsAction(topic));

    new Schedule(this, 'Schedule', {
      scheduleName: projectName,
      schedule: ScheduleExpression.rate(Duration.days(1)),
      target: new LambdaInvoke(handler),
    });
  }
}
