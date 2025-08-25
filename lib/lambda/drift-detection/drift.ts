import type { StackDriftDetectionStatus, StackDriftStatus } from '@aws-sdk/client-cloudformation';
import type { Region } from '../../utils/enums';
import { setTimeout } from 'node:timers/promises';
import { CloudFormationClient, DescribeStackDriftDetectionStatusCommand, DetectStackDriftCommand } from '@aws-sdk/client-cloudformation';

export async function detectDrift(stackName: string, region: Region): Promise<StackDriftStatus> {
  const client = new CloudFormationClient({ region });

  const detectCommand = new DetectStackDriftCommand({ StackName: stackName });
  const { StackDriftDetectionId } = await client.send(detectCommand); // Start drift detection

  let status: StackDriftDetectionStatus | undefined = 'DETECTION_IN_PROGRESS';
  const describeCommand = new DescribeStackDriftDetectionStatusCommand({ StackDriftDetectionId });
  while (status === 'DETECTION_IN_PROGRESS') { // Poll for status
    await setTimeout(1000);
    const { DetectionStatus, StackDriftStatus } = await client.send(describeCommand);
    status = DetectionStatus;
    if (status !== 'DETECTION_IN_PROGRESS') { // Return result if detection is complete
      return StackDriftStatus || 'UNKNOWN';
    }
  }

  throw new Error(`Error during drift detection for stack ${stackName} (${region})`);
}
