import type { Handler } from 'aws-lambda'
import type { Region } from '../../utils/regions'
import { regions } from '../../utils/regions'
import { detectDrift } from './drift'
import { notify } from './notify'
import { getStacks } from './stacks'

export const handler: Handler = async (): Promise<void> => {
  await Promise.all(regions.map(checkRegionForDrift))
}

async function checkRegionForDrift(region: Region): Promise<void> {
  const stacks = await getStacks(region)
  for (const stack of stacks) {
    await notifyIfDrifted(stack, region)
  }
}

async function notifyIfDrifted(stackName: string, region: Region): Promise<void> {
  const stackDriftStatus = await detectDrift(stackName, region)
  if (stackDriftStatus === 'IN_SYNC') {
    return
  }
  await notify(`Stack ${stackName} (${region}) has drift status ${stackDriftStatus}`)
}
