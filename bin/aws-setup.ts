import type { Environment } from 'aws-cdk-lib';
import { App, Aspects } from 'aws-cdk-lib';
import { config } from 'dotenv';
import { z } from 'zod';
import { BudgetStack } from '../lib/stacks/budget';
import { DriftDetectionStack } from '../lib/stacks/drift-detection';
import { GarbageCollectionStack } from '../lib/stacks/garbage-collection';
import { IdentityCenterStack } from '../lib/stacks/identity-center';
import { RemovalPolicyDestroyAspect } from '../lib/utils/aspects';
import { getEnv } from '../lib/utils/get-env';
import { getInstance } from '../lib/utils/instance';
import { getUserId } from '../lib/utils/user';

config({ quiet: true });

const account = getEnv('ACCOUNT_ID');
const username = getEnv('USERNAME');
const email = getEnv('EMAIL');

const app = new App();

const stackProps: { env: Environment; email: string } = {
  env: { account, region: 'eu-west-1' },
  email: z.email().parse(email),
};

Aspects.of(app).add(new RemovalPolicyDestroyAspect());

async function run(): Promise<void> {
  const { instanceArn, identityStoreId } = await getInstance();
  const userId = await getUserId({ username, identityStoreId });

  new IdentityCenterStack(app, 'IdentityCenterStack', { instanceArn, userId, ...stackProps });
  new BudgetStack(app, 'BudgetStack', stackProps);
  new GarbageCollectionStack(app, 'GarbageCollectionStack', stackProps);
  new DriftDetectionStack(app, 'DriftDetectionStack', stackProps);
}

run();
