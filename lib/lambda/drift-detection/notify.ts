import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { getEnv } from '../../utils/get-env';

const client = new SNSClient();

const topicArn = getEnv('TOPIC_ARN');

export async function sendNotification(message: string): Promise<void> {
  const command = new PublishCommand({ Message: message, TopicArn: topicArn });
  await client.send(command);
}
