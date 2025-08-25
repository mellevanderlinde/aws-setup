import type { Handler } from 'aws-lambda';
import { Region } from '../../utils/enums';
import { detectDrift } from './drift';
import { sendNotification } from './notify';
import { getStacks } from './stacks';

export const handler: Handler = async (): Promise<void> => {
  for (const region of [Region.EU_WEST_1, Region.US_EAST_1]) {
    const stackNames = await getStacks(region);
    for (const stackName of stackNames) {
      const stackDriftStatus = await detectDrift(stackName, region);
      if (stackDriftStatus !== 'IN_SYNC') {
        await sendNotification(`Stack ${stackName} (${region}) has drift status ${stackDriftStatus}`);
      }
    }
  }
};
