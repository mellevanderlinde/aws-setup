import {
  GetUserIdCommand,
  IdentitystoreClient,
} from '@aws-sdk/client-identitystore';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { getUserId } from '../../lib/utils/user';

const identityStoreMock = mockClient(IdentitystoreClient);

describe ('getUserId', () => {
  beforeEach(() => {
    identityStoreMock.reset();
  });

  it('should return user ID', async () => {
    identityStoreMock.on(GetUserIdCommand).resolvesOnce({
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
    identityStoreMock.on(GetUserIdCommand).resolvesOnce({});

    await expect(
      getUserId({
        username: 'testuser',
        identityStoreId: 'd-1234567890',
      }),
    ).rejects.toThrow('UserId is undefined');
  });
});
