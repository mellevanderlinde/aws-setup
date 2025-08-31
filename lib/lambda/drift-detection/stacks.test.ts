import { CloudFormationClient, ListStacksCommand } from '@aws-sdk/client-cloudformation';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { Region } from '../../utils/enums';
import { getStacks } from './stacks';

const cloudformationMock = mockClient(CloudFormationClient);

describe('getStacks', () => {
  beforeEach(() => {
    cloudformationMock.reset();
  });

  it('should return stack names', async () => {
    cloudformationMock
      .on(ListStacksCommand)
      .resolvesOnce({ StackSummaries: [
        { StackName: 'stack-1', CreationTime: new Date(), StackStatus: 'CREATE_COMPLETE' },
        { StackName: 'stack-2', CreationTime: new Date(), StackStatus: 'UPDATE_COMPLETE' },
      ] });

    const stacks = await getStacks(Region.EU_WEST_1);
    expect(stacks).toEqual(['stack-1', 'stack-2']);
  });

  it('should exclude CDKToolkit', async () => {
    cloudformationMock
      .on(ListStacksCommand)
      .resolvesOnce({ StackSummaries: [
        { StackName: 'CDKToolkit', CreationTime: new Date(), StackStatus: 'CREATE_COMPLETE' },
        { StackName: 'other-stack', CreationTime: new Date(), StackStatus: 'UPDATE_COMPLETE' },
      ] });

    const stacks = await getStacks(Region.US_EAST_1);
    expect(stacks).toEqual(['other-stack']);
  });

  it('should handle regions with no stacks', async () => {
    cloudformationMock.on(ListStacksCommand).resolvesOnce({ StackSummaries: [] });
    const stacks = await getStacks(Region.US_EAST_1);
    expect(stacks).toEqual([]);
  });

  it('should throw when a next token is returned', async () => {
    cloudformationMock.on(ListStacksCommand).resolvesOnce({ NextToken: 'token', StackSummaries: [] });
    await expect(getStacks(Region.EU_WEST_1)).rejects.toThrow('Pagination not supported');
  });

  it('should throw when StackName is undefined', async () => {
    cloudformationMock
      .on(ListStacksCommand)
      .resolvesOnce({ StackSummaries: [
        { StackName: undefined, CreationTime: new Date(), StackStatus: 'CREATE_COMPLETE' },
      ] });

    await expect(getStacks(Region.EU_WEST_1)).rejects.toThrow('StackName is undefined');
  });
});
