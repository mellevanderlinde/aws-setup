import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { mockClient } from 'aws-sdk-client-mock';
import { expect, it, vi } from 'vitest';
import { notify } from './notify';

const snsMock = mockClient(SNSClient);

vi.mock('../../utils/get-env', () => ({
  getEnv: vi.fn().mockReturnValue('topic-arn'),
}));

it('publishes a notification', async () => {
  snsMock.on(PublishCommand).resolvesOnce({});

  const result = await notify('Test message');

  expect(result).toBeUndefined();
  expect(snsMock.calls()).toHaveLength(1);
  expect(snsMock.calls()[0].args[0].input).toEqual({ Message: 'Test message', TopicArn: 'topic-arn' });
});
