import { CloudFormationClient, ListStacksCommand } from '@aws-sdk/client-cloudformation';
import { mockClient } from 'aws-sdk-client-mock';
import { expect, it } from 'vitest';
import { getStacks } from '../../../lib/lambda/drift-detection/stacks';
import { Region } from '../../../lib/utils/enums';

const cloudformationMock = mockClient(CloudFormationClient);

it('should return stack names', async () => {
  cloudformationMock
    .on(ListStacksCommand)
    .resolves({ StackSummaries: [
      { StackName: 'stack-1', CreationTime: new Date(), StackStatus: 'CREATE_COMPLETE' },
      { StackName: 'stack-2', CreationTime: new Date(), StackStatus: 'UPDATE_COMPLETE' },
    ] });

  const stacks = await getStacks(Region.EU_WEST_1);
  expect(stacks).toEqual(['stack-1', 'stack-2']);
});

it('should handle regions with no stacks', async () => {
  cloudformationMock.on(ListStacksCommand).resolves({ StackSummaries: [] });
  const stacks = await getStacks(Region.US_EAST_1);
  expect(stacks).toEqual([]);
});

it('should throw when a next token is returned', async () => {
  cloudformationMock.on(ListStacksCommand).resolves({ NextToken: 'token', StackSummaries: [] });
  await expect(getStacks(Region.EU_WEST_1)).rejects.toThrow('Pagination not supported');
});
