import { CloudFormationClient, DescribeStackDriftDetectionStatusCommand, DetectStackDriftCommand } from '@aws-sdk/client-cloudformation';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Region } from '../../utils/enums';
import { detectDrift } from './drift';

const cloudformationMock = mockClient(CloudFormationClient);

vi.mock('node:timers/promises', () => ({
  setTimeout: vi.fn(),
}));

describe ('detectDrift', () => {
  beforeEach(() => {
    cloudformationMock.reset();
  });

  it('detects drift successfully', async () => {
    cloudformationMock.on(DetectStackDriftCommand).resolvesOnce({
      StackDriftDetectionId: 'test-detection-id',
    });

    cloudformationMock.on(DescribeStackDriftDetectionStatusCommand)
      .resolvesOnce({ DetectionStatus: 'DETECTION_IN_PROGRESS' })
      .resolvesOnce({ DetectionStatus: 'DETECTION_IN_PROGRESS' })
      .resolvesOnce({ DetectionStatus: 'DETECTION_COMPLETE', StackDriftStatus: 'DRIFTED' });

    const result = await detectDrift('test-stack', Region.US_EAST_1);
    expect(result).toBe('DRIFTED');
  });

  it('handles no drift', async () => {
    cloudformationMock.on(DetectStackDriftCommand).resolvesOnce({
      StackDriftDetectionId: 'test-detection-id',
    });

    cloudformationMock.on(DescribeStackDriftDetectionStatusCommand)
      .resolvesOnce({ DetectionStatus: 'DETECTION_IN_PROGRESS' })
      .resolvesOnce({ DetectionStatus: 'DETECTION_COMPLETE', StackDriftStatus: 'IN_SYNC' });

    const result = await detectDrift('test-stack', Region.US_EAST_1);
    expect(result).toBe('IN_SYNC');
  });

  it('defaults to unknown status', async () => {
    cloudformationMock.on(DetectStackDriftCommand).resolvesOnce({
      StackDriftDetectionId: 'test-detection-id',
    });

    cloudformationMock.on(DescribeStackDriftDetectionStatusCommand)
      .resolvesOnce({ DetectionStatus: 'DETECTION_IN_PROGRESS' })
      .resolvesOnce({ DetectionStatus: 'DETECTION_COMPLETE', StackDriftStatus: undefined });

    const result = await detectDrift('test-stack', Region.US_EAST_1);
    expect(result).toBe('UNKNOWN');
  });
});
