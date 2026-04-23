import type { StackProps } from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import * as path from 'node:path'
import { Duration, Stack } from 'aws-cdk-lib'
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions'
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Architecture, LoggingFormat, Runtime, SystemLogLevel } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Schedule, ScheduleExpression } from 'aws-cdk-lib/aws-scheduler'
import { LambdaInvoke } from 'aws-cdk-lib/aws-scheduler-targets'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions'

const projectName = 'drift-detection'

export class DriftDetectionStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { email: string }) {
    super(scope, id, props)

    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: projectName,
      retention: RetentionDays.TWO_WEEKS,
    })

    const topic = new Topic(this, 'Topic', {
      enforceSSL: true,
      topicName: projectName,
    })

    topic.addSubscription(new EmailSubscription(props.email))
    topic.grantPublish(new ServicePrincipal('cloudwatch.amazonaws.com'))

    const handler = new NodejsFunction(this, 'DetectDrift', {
      architecture: Architecture.ARM_64,
      bundling: { minify: true },
      entry: path.join(__dirname, '..', 'lambda', 'drift-detection', 'index.ts'),
      environment: { TOPIC_ARN: topic.topicArn },
      functionName: projectName,
      loggingFormat: LoggingFormat.JSON,
      logGroup,
      runtime: Runtime.NODEJS_24_X,
      systemLogLevelV2: SystemLogLevel.WARN,
      timeout: Duration.minutes(1),
    })

    topic.grantPublish(handler)

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
    }))

    handler.addToRolePolicy(new PolicyStatement({
      actions: ['cloudformation:DescribeStackDriftDetectionStatus'],
      resources: ['*'],
    }))

    handler
      .metricErrors()
      .createAlarm(this, `Alarm${handler.node.id}`, {
        alarmName: handler.functionName,
        evaluationPeriods: 1,
        threshold: 1,
      })
      .addAlarmAction(new SnsAction(topic))

    new Schedule(this, 'Schedule', {
      schedule: ScheduleExpression.rate(Duration.days(1)),
      scheduleName: projectName,
      target: new LambdaInvoke(handler),
    })
  }
}
