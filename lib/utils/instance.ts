import { ListInstancesCommand, SSOAdminClient } from '@aws-sdk/client-sso-admin'
import { assertDefined } from './assert-defined'

const client = new SSOAdminClient({ region: 'eu-west-1' })

export async function getInstance(): Promise<{ instanceArn: string, identityStoreId: string }> {
  const { Instances } = await client.send(new ListInstancesCommand())
  if (Instances?.length !== 1) {
    throw new Error('Unexpected number of instances')
  }
  return {
    identityStoreId: assertDefined(Instances[0].IdentityStoreId),
    instanceArn: assertDefined(Instances[0].InstanceArn),
  }
}
