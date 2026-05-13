import type { StackDriftStatus } from '@aws-sdk/client-cloudformation'
import type { Region } from '../../utils/regions'
import { setTimeout } from 'node:timers/promises'
import { CloudFormationClient, DescribeStackDriftDetectionStatusCommand, DetectStackDriftCommand } from '@aws-sdk/client-cloudformation'
import { assertDefined } from '../../utils/assert-defined'

export async function detectDrift(stackName: string, region: Region): Promise<StackDriftStatus> {
  const client = new CloudFormationClient({ region })

  const { StackDriftDetectionId } = await client.send(
    new DetectStackDriftCommand({ StackName: stackName }),
  )

  return pollUntilComplete(client, assertDefined(StackDriftDetectionId, 'StackDriftDetectionId'))
}

async function pollUntilComplete(client: CloudFormationClient, detectionId: string): Promise<StackDriftStatus> {
  await setTimeout(1000)

  const { DetectionStatus, StackDriftStatus } = await client.send(
    new DescribeStackDriftDetectionStatusCommand({ StackDriftDetectionId: detectionId }),
  )

  if (DetectionStatus === 'DETECTION_IN_PROGRESS') {
    return pollUntilComplete(client, detectionId)
  }

  return StackDriftStatus || 'UNKNOWN'
}
