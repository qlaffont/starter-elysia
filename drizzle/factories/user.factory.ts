import { Users } from '@db/schemas';
import { faker } from '@faker-js/faker';

import { CryptoUtils } from '../../src/services/crypto/crypto';

export const userFactory = async (
  input: Partial<typeof Users.$inferInsert> = {},
): Promise<typeof Users.$inferInsert> => {
  const {
    firstName: inputFirstName,
    lastName: inputLastName,
    password: inputPassword,
    ...data
  } = input;
  const firstName = inputFirstName || faker.person.firstName();
  const lastName = inputLastName || faker.person.firstName();
  const password = inputPassword || faker.internet.password();

  return {
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }),
    password: await CryptoUtils.getArgonHash(password),
    ...data,
  };
};
