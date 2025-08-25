import { ListInstancesCommand, SSOAdminClient } from '@aws-sdk/client-sso-admin';
import { mockClient } from 'aws-sdk-client-mock';
import { expect, it } from 'vitest';
import { getInstance } from '../../lib/utils/instance';

const ssoAdminMock = mockClient(SSOAdminClient);

it('should return instance ARN and identity store ID', async () => {
  ssoAdminMock.on(ListInstancesCommand).resolves({
    Instances: [
      {
        InstanceArn: 'arn:aws:sso:::instance/ssoins-1234567890abcdef',
        IdentityStoreId: 'd-1234567890',
      },
    ],
  });

  expect(await getInstance()).toEqual({
    instanceArn: 'arn:aws:sso:::instance/ssoins-1234567890abcdef',
    identityStoreId: 'd-1234567890',
  });
});

it('should throw an error if there are no instances', async () => {
  ssoAdminMock.on(ListInstancesCommand).resolves({
    Instances: [],
  });

  await expect(getInstance()).rejects.toThrow('Unexpected number of instances');
});

it('should throw an error if there are multiple instances', async () => {
  ssoAdminMock.on(ListInstancesCommand).resolves({
    Instances: [
      {
        InstanceArn: 'arn:aws:sso:::instance/ssoins-1234567890abcdef',
        IdentityStoreId: 'd-1234567890',
      },
      {
        InstanceArn: 'arn:aws:sso:::instance/ssoins-abcdef1234567890',
        IdentityStoreId: 'd-abcdef1234567890',
      },
    ],
  });

  await expect(getInstance()).rejects.toThrow('Unexpected number of instances');
});

it('should throw an error if instance ARN is missing', async () => {
  ssoAdminMock.on(ListInstancesCommand).resolves({
    Instances: [
      {
        IdentityStoreId: 'd-1234567890',
      },
    ],
  });

  await expect(getInstance()).rejects.toThrow('InstanceArn is undefined');
});

it('should throw an error if identity store ID is missing', async () => {
  ssoAdminMock.on(ListInstancesCommand).resolves({
    Instances: [
      {
        InstanceArn: 'arn:aws:sso:::instance/ssoins-1234567890abcdef',
      },
    ],
  });

  await expect(getInstance()).rejects.toThrow('IdentityStoreId is undefined');
});
