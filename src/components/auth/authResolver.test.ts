import 'reflect-metadata';

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@db/connection';
import { Users } from '@db/schemas';
import { eq } from 'drizzle-orm';
import set from 'lodash/set';

import {
  testGQL,
  testIfAccessTokenIsInvalidMutation,
  testIfAccessTokenIsInvalidQuery,
  testIfMutationIsProtected,
  testIfQueryIsProtected,
  testPasswordValidation,
} from '../../../test/utils/gql';
import {
  DEFAULT_PASSWORD,
  createUserAndGetAccessToken,
  setupTests,
} from '../../../test/utils/setup';
import { runServer } from '../../server';
import { CryptoUtils } from '../../services/crypto/crypto';
import AuthController from './authController';
import { AuthErrors, type User, type UserRegister } from './authType';

setupTests();

describe('Auth Resolver', async () => {
  const email = 'auth-resolver@test.fr';
  let user: User;
  let accessToken: string;
  const server = await runServer();

  beforeAll(async () => {
    const res = await createUserAndGetAccessToken({ email });
    //@ts-ignore
    user = res[0];
    //@ts-ignore
    accessToken = res[1];
    await server.listen({ port: 3000 });
  });

  afterAll(async () => {
    await db.delete(Users).where(eq(Users.id, user.id));
    server.stop();
  });

  describe('getUserMe', async () => {
    const gql = `
      {
        getUserMe {
          email
        }
      }
    `;
    const goodResponse = {
      data: {
        getUserMe: {
          email,
        },
      },
    };

    test('should return an access denied if no access token', async () => {
      await testIfQueryIsProtected(server, gql);
    });

    test('should return an access denied with wrong accessToken', async () => {
      await testIfAccessTokenIsInvalidQuery(server, gql);
    });

    test('should return 200 with user information', async () => {
      const res = await testGQL(server, gql, {}, accessToken);

      expect(res).toMatchObject(goodResponse);
      //@ts-ignore
      expect(res.errors).toBe(undefined);
    });
  });

  describe('userRegister', async () => {
    const gql = `
      mutation ($userRegister: UserRegister!) {
        registerUser(userRegister: $userRegister)
      }
    `;
    const goodVariables: UserRegister = {
      email: 'goodmail@mail.com',
      firstName: 'First',
      lastName: 'Last',
      password: 'password',
    };
    const goodResponse = {
      data: { registerUser: 'OK' },
    };

    afterAll(async () => {
      await db.delete(Users).where(eq(Users.email, goodVariables.email));
    });

    test('should create a new record in DB', async () => {
      const res = await testGQL(server, gql, {
        userRegister: goodVariables,
      });

      const record = await db.query.Users.findFirst({
        where: eq(Users.email, goodVariables.email),
      });

      expect(res).toMatchObject(goodResponse);
      //@ts-ignore
      expect(res?.errors).toBe(undefined);
      expect(record).not.toBe(undefined);
    });

    test('should not allow bad emails', async () => {
      const res = await testGQL(server, gql, {
        userRegister: { ...goodVariables, email: 'badmail' },
      });

      expect(res).not.toMatchObject(goodResponse);
      expect(res?.errors![0].message).toBe('Bad Request');
      expect(res?.errors![0].extensions!.context).toMatchObject({
        error: AuthErrors.email_not_valid,
      });
    });

    test('should not allow already used email', async () => {
      const res = await testGQL(server, gql, {
        userRegister: goodVariables,
      });

      expect(res).not.toMatchObject(goodResponse);
      expect(res?.errors![0].message).toBe('Bad Request');
      expect(res?.errors![0].extensions!.context).toMatchObject({
        error: AuthErrors.user_already_exist,
      });
    });

    test('should fullfil password validation', async () =>
      await testPasswordValidation(
        server,
        gql,
        {
          userRegister: {
            ...goodVariables,
            email: 'goodmailpassword@mail.com',
          },
        },
        'userRegister.password',
      ));
  });

  describe('changePassword', async () => {
    const gql = `
    mutation($oldPassword: String!, $newPassword: String!) {
      changePassword(oldPassword: $oldPassword, newPassword: $newPassword)
    }
    `;
    const goodVariables = {
      oldPassword: DEFAULT_PASSWORD,
      newPassword: 'newPassword',
    };
    const goodResponse = {
      data: { changePassword: 'OK' },
    };

    let token: string;
    beforeAll(async () => {
      const res = await AuthController.loginAndGenerateToken(user, {
        //@ts-ignore
        refresh: {
          //@ts-ignore
          set: () => {},
        },
      });

      token = res?.access_token;
    });

    afterAll(async () => {
      await db
        .update(Users)
        .set({
          password: await CryptoUtils.getArgonHash(DEFAULT_PASSWORD),
        })
        .where(eq(Users.email, email));
    });

    test('should return an access denied if no access token', async () => {
      await testIfMutationIsProtected(server, gql, goodVariables);
    });

    test('should return an access denied with wrong accessToken', async () => {
      await testIfAccessTokenIsInvalidMutation(server, gql, goodVariables);
    });

    test("should change user's password", async () => {
      const beforeMutationUser = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });

      const beforePassword = beforeMutationUser?.password;

      const res = await testGQL(server, gql, goodVariables, token);

      const afterMutationUser = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });
      const afterPassword = afterMutationUser?.password;

      expect(res).toMatchObject(goodResponse);
      //@ts-ignore
      expect(res?.errors).toBe(undefined);
      expect(beforePassword).not.toEqual(afterPassword);
    });

    test('should not allow a wrong password', async () => {
      const beforeMutationUser = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });

      const beforePassword = beforeMutationUser?.password;

      const badVariables = set(goodVariables, 'oldPassword', 'wrong');
      const res = await testGQL(server, gql, badVariables, token);

      const afterMutationUser = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });
      const afterPassword = afterMutationUser?.password;

      expect(res).not.toMatchObject(goodResponse);
      //@ts-ignore
      expect(res.errors![0].message).toMatch('Bad Request');
      expect(res.errors![0].extensions!.context).toMatchObject({
        error: 'password_error',
      });
      expect(beforePassword).toBe(afterPassword!);
    });
  });

  describe('askResetPassword', async () => {
    const gql = `
    mutation($email: String!) {
      askResetPassword(email: $email)
    }
    `;
    const goodVariables = {
      email,
    };
    const goodResponse = {
      data: { askResetPassword: 'OK' },
    };

    let token: string;
    beforeAll(async () => {
      const res = await AuthController.loginAndGenerateToken(user, {
        //@ts-ignore
        refresh: {
          //@ts-ignore
          set: () => {},
        },
      });

      token = res?.access_token;
    });

    afterAll(async () => {
      await db
        .update(Users)
        .set({ resetPasswordCode: null })
        .where(eq(Users.email, email));
    });

    test('create a reset code', async () => {
      const res = await testGQL(server, gql, goodVariables, token);

      const record = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });

      expect(res).toMatchObject(goodResponse);
      //@ts-ignore
      expect(res?.errors).toBe(undefined);
      expect(record?.resetPasswordCode).not.toBe(null);
    });

    test('should not allow an unknown account', async () => {
      const badVariables = set(goodVariables, 'email', 'unknown@test.com');
      const res = await testGQL(server, gql, badVariables, token);

      expect(res).not.toMatchObject(goodResponse);
      expect(res?.errors).not.toBe(undefined);
      expect(res.errors![0].message).toMatch('Bad Request');
      expect(res.errors![0].extensions?.context).toMatchObject({
        error: 'account_not_found',
      });
    });
  });

  describe('resetPassword', async () => {
    const gql = `
    mutation($email: String!, $resetCode: String!, $password: String!) {
      resetPassword(email: $email, resetCode: $resetCode, password: $password)
    }
    `;

    const resetCode = '1234';
    const goodVariables = {
      email,
      password: 'newPassword',
      resetCode,
    };
    const goodResponse = {
      data: { resetPassword: 'OK' },
    };

    let token: string;
    beforeAll(async () => {
      const res = await AuthController.loginAndGenerateToken(user, {
        //@ts-ignore
        refresh: {
          //@ts-ignore
          set: () => {},
        },
      });

      token = res?.access_token;
    });

    afterAll(async () => {
      await db
        .update(Users)
        .set({
          resetPasswordCode: null,
          password: await CryptoUtils.getArgonHash(DEFAULT_PASSWORD),
        })
        .where(eq(Users.email, email));
    });

    test('should reset the password', async () => {
      await db
        .update(Users)
        .set({ resetPasswordCode: resetCode })
        .where(eq(Users.email, email));

      const beforeMutationUser = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });

      const res = await testGQL(server, gql, goodVariables, token);

      const afterMutationUser = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });

      expect(res).toMatchObject(goodResponse);
      //@ts-ignore
      expect(res?.errors).toBe(undefined);
      expect(afterMutationUser?.resetPasswordCode).toBe(null);
      expect(afterMutationUser?.password).not.toBe(
        beforeMutationUser?.password,
      );
    });

    test('should not allow a wrong reset code', async () => {
      const beforeMutationUser = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });

      const badVariables = set(goodVariables, 'resetCode', '4321');
      const res = await testGQL(server, gql, badVariables, token);

      const afterMutationUser = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });

      expect(res).not.toMatchObject(goodResponse);
      //@ts-ignore
      expect(res?.errors).not.toBe(undefined);
      expect(res.errors![0].message).toMatch('Bad Request');
      expect(res.errors![0].extensions?.context).toMatchObject({
        error: 'wrong_reset_code',
      });
      expect(afterMutationUser?.password).toBe(beforeMutationUser!.password!);
    });

    test('should not allow a wrong reset code', async () => {
      const beforeMutationUser = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });

      const badVariables = set(goodVariables, 'email', 'unknown@test.fr');
      const res = await testGQL(server, gql, badVariables, token);

      const afterMutationUser = await db.query.Users.findFirst({
        where: eq(Users.email, email),
      });

      expect(res).not.toMatchObject(goodResponse);
      //@ts-ignore
      expect(res?.errors).not.toBe(undefined);
      expect(res.errors![0].message).toMatch('Bad Request');
      expect(res.errors![0].extensions?.context).toMatchObject({
        error: 'account_not_found',
      });
      expect(afterMutationUser?.password).toBe(beforeMutationUser!.password!);
    });
  });
});
