import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { getEnv } from '../../utils/get-env';

const client = new SNSClient();

export async function sendNotification(message: string): Promise<void> {
  const command = new PublishCommand({ Message: message, TopicArn: getEnv('TOPIC_ARN') });
  await client.send(command);
}
