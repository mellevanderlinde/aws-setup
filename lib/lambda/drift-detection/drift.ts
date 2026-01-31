import { setTimeout } from 'node:timers/promises';
import { CloudFormationClient, DescribeStackDriftDetectionStatusCommand, DetectStackDriftCommand, StackDriftStatus } from '@aws-sdk/client-cloudformation';
import { assertDefined } from '../../utils/assert-defined';
import { Region } from '../../utils/types';

export async function detectDrift(stackName: string, region: Region): Promise<StackDriftStatus> {
  const client = new CloudFormationClient({ region });
  const detectCommand = new DetectStackDriftCommand({ StackName: stackName });
  const { StackDriftDetectionId } = await client.send(detectCommand);
  return pollUntilComplete(client, assertDefined(StackDriftDetectionId, 'StackDriftDetectionId'));
}

async function pollUntilComplete(client: CloudFormationClient, detectionId: string): Promise<StackDriftStatus> {
  const describeCommand = new DescribeStackDriftDetectionStatusCommand({ StackDriftDetectionId: detectionId });

  while (true) {
    await setTimeout(1000);
    const { DetectionStatus, StackDriftStatus } = await client.send(describeCommand);

    const stillDetecting = DetectionStatus === 'DETECTION_IN_PROGRESS';
    if (stillDetecting) {
      continue;
    }

    return StackDriftStatus || 'UNKNOWN';
  }
}
