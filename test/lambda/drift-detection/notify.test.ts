import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { mockClient } from 'aws-sdk-client-mock';
import { expect, it, vi } from 'vitest';
import { sendNotification } from '../../../lib/lambda/drift-detection/notify';

const snsMock = mockClient(SNSClient);

it('publishes a notification', async () => {
  vi.stubEnv('TOPIC_ARN', 'topic-arn');
  snsMock.on(PublishCommand).resolvesOnce({});

  const result = await sendNotification('Test message');

  expect(result).toBeUndefined();
  expect(snsMock.calls()).toHaveLength(1);
  expect(snsMock.calls()[0].args[0].input).toEqual({ Message: 'Test message', TopicArn: 'topic-arn' });
});

it('throws if TOPIC_ARN is not set', async () => {
  vi.unstubAllEnvs();
  snsMock.reset();

  await expect(sendNotification('Test message')).rejects.toThrow('Environment variable TOPIC_ARN is missing');
  expect(snsMock.calls()).toHaveLength(0);
});
