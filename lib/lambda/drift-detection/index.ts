import type { Handler } from 'aws-lambda';
import type { Region } from '../../utils/types';
import { detectDrift } from './drift';
import { sendNotification } from './notify';
import { getStacks } from './stacks';

const regions: Region[] = ['eu-west-1', 'us-east-1'];

export const handler: Handler = async (): Promise<void> => {
  await Promise.all(regions.map(checkRegionForDrift));
};

async function checkRegionForDrift(region: Region): Promise<void> {
  const stacks = await getStacks(region);
  for (const stack of stacks) await notifyIfDrifted(stack, region);
}

async function notifyIfDrifted(stackName: string, region: Region): Promise<void> {
  const stackDriftStatus = await detectDrift(stackName, region);
  if (stackDriftStatus === 'IN_SYNC')
    return;
  await sendNotification(`Stack ${stackName} (${region}) has drift status ${stackDriftStatus}`);
}
