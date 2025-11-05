import { GetUserIdCommand, IdentitystoreClient } from '@aws-sdk/client-identitystore';
import { assertDefined } from './assert-defined';

const client = new IdentitystoreClient({ region: 'eu-west-1' });

export async function getUserId(props: {
  username: string;
  identityStoreId: string;
}): Promise<string> {
  const command = new GetUserIdCommand({
    IdentityStoreId: props.identityStoreId,
    AlternateIdentifier: {
      UniqueAttribute: {
        AttributePath: 'Username',
        AttributeValue: props.username,
      },
    },
  });
  const { UserId } = await client.send(command);
  return assertDefined(UserId, 'UserId');
}
