import { StackDriftStatus } from '@aws-sdk/client-cloudformation';
import { expect, it, vi } from 'vitest';
import { handler } from '../../../lib/lambda/drift-detection';
import * as notify from '../../../lib/lambda/drift-detection/notify';

const mocks = vi.hoisted(() => {
  return {
    detectDrift: vi.fn(),
  };
});

vi.mock('../../../lib/lambda/drift-detection/drift', () => {
  return {
    detectDrift: mocks.detectDrift,
  };
});

vi.mock('../../../lib/lambda/drift-detection/stacks', () => ({
  getStacks: vi.fn().mockResolvedValue(['stack1', 'stack2']),
}));

vi.mock('../../../lib/lambda/drift-detection/notify', () => ({
  sendNotification: vi.fn(),
}));

it('should not notify if all stacks are in sync', async () => {
  mocks.detectDrift.mockReturnValue(StackDriftStatus.IN_SYNC);

  await handler({}, vi.fn() as never, vi.fn());

  expect(notify.sendNotification).not.toHaveBeenCalled();
});

it('should notify for drifted stacks', async () => {
  mocks.detectDrift
    .mockReturnValueOnce(StackDriftStatus.IN_SYNC)
    .mockReturnValueOnce(StackDriftStatus.DRIFTED)
    .mockReturnValueOnce(StackDriftStatus.NOT_CHECKED)
    .mockReturnValueOnce(StackDriftStatus.IN_SYNC);

  await handler({}, vi.fn() as never, vi.fn());

  expect(notify.sendNotification).toHaveBeenCalledTimes(2);
  expect(notify.sendNotification).toHaveBeenNthCalledWith(1, 'Stack stack2 (eu-west-1) has drift status DRIFTED');
  expect(notify.sendNotification).toHaveBeenNthCalledWith(2, 'Stack stack1 (us-east-1) has drift status NOT_CHECKED');
});
