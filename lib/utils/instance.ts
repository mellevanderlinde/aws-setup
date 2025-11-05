import { ListInstancesCommand, SSOAdminClient } from '@aws-sdk/client-sso-admin';
import { assertDefined } from './assert-defined';

const client = new SSOAdminClient({ region: 'eu-west-1' });

interface Instance {
  instanceArn: string;
  identityStoreId: string;
}

export async function getInstance(): Promise<Instance> {
  const { Instances } = await client.send(new ListInstancesCommand());
  if (Instances?.length !== 1) {
    throw new Error('Unexpected number of instances');
  }
  const { InstanceArn, IdentityStoreId } = Instances[0];
  return {
    instanceArn: assertDefined(InstanceArn, 'InstanceArn'),
    identityStoreId: assertDefined(IdentityStoreId, 'IdentityStoreId'),
  };
}
