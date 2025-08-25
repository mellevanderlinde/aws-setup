import {
  GetUserIdCommand,
  IdentitystoreClient,
} from '@aws-sdk/client-identitystore';
import { mockClient } from 'aws-sdk-client-mock';
import { expect, it } from 'vitest';
import { getUserId } from '../../lib/utils/user';

const identityStoreMock = mockClient(IdentitystoreClient);

it('should return user ID', async () => {
  identityStoreMock.on(GetUserIdCommand).resolves({
    UserId: 'user-id-1234567890',
  });

  expect(
    await getUserId({
      username: 'testuser',
      identityStoreId: 'd-1234567890',
    }),
  ).toEqual('user-id-1234567890');
});

it('should throw an error if user ID is missing', async () => {
  identityStoreMock.on(GetUserIdCommand).resolves({});

  await expect(
    getUserId({
      username: 'testuser',
      identityStoreId: 'd-1234567890',
    }),
  ).rejects.toThrow('UserId is undefined');
});
