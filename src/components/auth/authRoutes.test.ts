import 'reflect-metadata';

import { equal, notEqual } from 'node:assert';

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import { db } from '@db/connection';
import { Tokens, Users } from '@db/schemas';
import { eq } from 'drizzle-orm';

import { testRoute } from '../../../test/utils/rest';
import {
  DEFAULT_PASSWORD,
  createUserAndGetAccessToken,
  setupTests,
} from '../../../test/utils/setup';
import { runServer } from '../../server';
import type { User } from './authType';

setupTests();

describe('Auth ROUTES', async () => {
  const email = 'auth-routes@test.fr';
  let user: User;
  let refreshToken: string;
  const server = await runServer();

  beforeAll(async () => {
    const res = await createUserAndGetAccessToken({ email });
    //@ts-ignore
    user = res[0];
    //@ts-ignore
    refreshToken = res[2];
    await server.listen({ port: 3000 });
  });

  afterAll(async () => {
    await db.delete(Users).where(eq(Users.id, user.id));
    server.stop();
  });

  describe('global', async () => {
    test('should return Not Found by default', async () => {
      await testRoute(
        server,
        '/this-is-a-random-url',
        'GET',
        {},
        {
          supposedStatus: 404,
          supposedMessage: { error: 'Not Found' },
        },
      );
    });
  });

  describe('login', async () => {
    const goodPayload = {
      email,
      password: DEFAULT_PASSWORD,
    };

    test('should login user', async () => {
      const response = await testRoute(
        server,
        '/auth/login',
        'POST',
        {
          body: goodPayload,
        },
        {
          supposedStatus: 200,
        },
      );

      expect(Object.keys(response!)).toMatchObject(['access_token']);
    });

    test('should not allow inexisting account', async () => {
      await testRoute(
        server,
        '/auth/login',
        'POST',
        {
          body: { ...goodPayload, email: 'unknown@mail.com' },
        },
        {
          notSupposedStatus: 200,
          supposedStatus: 400,
          supposedMessage: {
            error: 'Bad Request',
            context: {
              error: 'account_not_found',
            },
          },
        },
      );
    });

    test('should not allow wrong password', async () => {
      await testRoute(
        server,
        '/auth/login',
        'POST',
        {
          body: { ...goodPayload, password: 'bad' },
        },
        {
          notSupposedStatus: 200,
          supposedStatus: 400,
          supposedMessage: {
            error: 'Bad Request',
            context: {
              error: 'account_not_found',
            },
          },
        },
      );
    });
  });

  describe('refresh', async () => {
    test('should be able to generate access token', async () => {
      const response = await testRoute(
        server,
        '/auth/refresh',
        'POST',
        {
          headers: {
            Cookie: `refresh=${refreshToken}`,
          },
        },
        { supposedStatus: 200 },
      );

      expect(Object.keys(response!)).toMatchObject(['access_token']);
    });

    test('should return a 400 if no refresh', async () => {
      await testRoute(
        server,
        '/auth/refresh',
        'POST',
        {},
        { supposedStatus: 400 },
      );
    });
  });

  describe('logout', async () => {
    let token: string;
    beforeEach(async () => {
      const res = await testRoute(
        server,
        '/auth/login',
        'POST',
        {
          body: { email, password: DEFAULT_PASSWORD },
        },
        {},
      );

      //@ts-ignore\
      token = res!.access_token;
    });

    test('requires a bearer token', async () => {
      await testRoute(
        server,
        '/auth/logout',
        'POST',
        {},
        {
          notSupposedStatus: 200,
        },
      );

      const record = (
        await db
          .select()
          .from(Tokens)
          .leftJoin(Users, eq(Tokens.ownerId, Users.id))
          .where(eq(Tokens.accessToken, token))
      )[0];

      notEqual(record, null);
    });

    test('should logout user', async () => {
      await testRoute(
        server,
        '/auth/logout',
        'POST',
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
        {
          supposedStatus: 200,
        },
      );

      const record = await db.query.Tokens.findFirst({
        where: eq(Tokens.accessToken, token),
      });

      equal(record, null);
    });

    test('requires a valid bearer token', async () => {
      await testRoute(
        server,
        '/auth/logout',
        'POST',
        {
          headers: {
            authorization: 'Bearer aBadToken',
          },
        },
        {
          notSupposedStatus: 200,
        },
      );

      const record = (
        await db
          .select()
          .from(Tokens)
          .leftJoin(Users, eq(Tokens.ownerId, Users.id))
          .where(eq(Tokens.accessToken, token))
      )[0];

      notEqual(record, null);
    });
  });
});
