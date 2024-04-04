/* eslint-disable @typescript-eslint/ban-ts-comment */
import { db } from '@db/connection';
import { eq } from 'drizzle-orm';
import pino from 'pino';

import { userFactory } from '../../drizzle/factories';
import { Tokens, Users } from '../../drizzle/schemas';
import AuthController from '../../src/components/auth/authController';
import { User } from '../../src/components/auth/authType';
import { env } from '../../src/services/env';

export const DEFAULT_PASSWORD = 'password';

export const createUserAndGetAccessToken = async (userData?: Partial<User>) => {
  const user = (
    await db
      .insert(Users)
      .values(await userFactory({ ...userData, password: DEFAULT_PASSWORD }))
      .returning()
  )[0];

  const res = await AuthController.loginAndGenerateToken(user, {
    refresh: {
      //@ts-ignore
      set: () => {},
    },
  });

  const refreshToken = (await db.query.Tokens.findFirst({
    where: eq(Tokens.accessToken, res.access_token),
  }))!.refreshToken;

  return [user, res.access_token, refreshToken];
};

export const setupTests = async () => {
  global.env = env;
  //@ts-ignore
  global.env.LOG = 'silent';
  const logger = pino({ level: global.env.LOG });
  global.logger = logger;

  //@ts-ignore
  // global.env.NODE_ENV = 'test';
};
