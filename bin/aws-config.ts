import type { Environment } from 'aws-cdk-lib';
import { App, Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { config } from 'dotenv';
import { BudgetStack } from '../lib/stacks/budget';
import { DriftDetectionStack } from '../lib/stacks/drift-detection';
import { GarbageCollectionStack } from '../lib/stacks/garbage-collection';
import { IdentityCenterStack } from '../lib/stacks/identity-center';
import { RemovalPolicyDestroyAspect } from '../lib/utils/aspects';
import { Region } from '../lib/utils/enums';
import { getEnv } from '../lib/utils/get-env';
import { getInstance } from '../lib/utils/instance';
import { getUserId } from '../lib/utils/user';

config();

const app = new App();

const stackProps: { env: Environment; email: string } = {
  env: { account: getEnv('ACCOUNT_ID'), region: Region.EU_WEST_1 },
  email: getEnv('EMAIL'),
};

new BudgetStack(app, 'BudgetStack', stackProps);
new GarbageCollectionStack(app, 'GarbageCollectionStack', stackProps);
new DriftDetectionStack(app, 'DriftDetectionStack', stackProps);

Aspects.of(app).add(new RemovalPolicyDestroyAspect());
Aspects.of(app).add(new AwsSolutionsChecks());

async function run(): Promise<void> {
  const { instanceArn, identityStoreId } = await getInstance();
  const userId = await getUserId({ username: getEnv('USERNAME'), identityStoreId });
  new IdentityCenterStack(app, 'IdentityCenterStack', { instanceArn, userId, ...stackProps });
}

run();
