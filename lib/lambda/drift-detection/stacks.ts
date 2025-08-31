import type { Region } from '../../utils/enums';
import { CloudFormationClient, ListStacksCommand, StackStatus } from '@aws-sdk/client-cloudformation';
import { assertDefined } from '../../utils/assert-defined';

export async function getStacks(region: Region): Promise<string[]> {
  const client = new CloudFormationClient({ region });
  const command = new ListStacksCommand({
    StackStatusFilter: [
      StackStatus.CREATE_COMPLETE,
      StackStatus.IMPORT_COMPLETE,
      StackStatus.IMPORT_ROLLBACK_COMPLETE,
      StackStatus.ROLLBACK_COMPLETE,
      StackStatus.UPDATE_COMPLETE,
      StackStatus.UPDATE_ROLLBACK_COMPLETE,
    ],
  });
  const { NextToken, StackSummaries } = await client.send(command);
  if (NextToken) {
    throw new Error('Pagination not supported');
  }
  return StackSummaries
    ?.filter(s => s.StackName !== 'CDKToolkit') // Exclude CDKToolkit (managed by CDK) which often shows drift (even right after a fresh bootstrap)
    .map(s => assertDefined(s.StackName, 'StackName')) || [];
}
