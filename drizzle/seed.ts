import { connection, db } from '@db/connection';
import pino from 'pino';

import { env } from '../src/services/env';
import { userFactory } from './factories/user.factory';
import { Users } from './schemas';

const logger = pino({ level: env.LOG || 'info' });

async function main() {
  // ! CONFIGURATION
  const nbOfUsers = 3;

  // 1 - Create Users
  for (let index = 0; index < nbOfUsers; index++) {
    let userData: typeof Users.$inferInsert;

    if (index === 0) {
      userData = await userFactory({
        email: 'test@test.fr',
        password: 'password',
      });
    } else {
      userData = await userFactory({
        password: 'password',
      });
    }

    const user = await db.insert(Users).values([userData]).returning();

    logger.debug(`New User Inserted ${user[0].id}`);
    logger.debug(userData);
  }
}

main()
  .then(async () => {
    logger.info('Database seeded !');
    await connection.end();
  })
  .catch(async (e) => {
    logger.error(e);
    await connection.end();
    process.exit(1);
  });
