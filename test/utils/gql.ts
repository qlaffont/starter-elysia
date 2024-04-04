import { expect } from 'bun:test';
import set from 'lodash/set';

import { AuthErrors } from '../../src/components/auth/authType';
import { testRoute } from './rest';

export const testIfQueryIsProtected = async (
  server,
  gql,
  variables?: object,
) => {
  const res = await testRoute(server, '/graphql', 'POST', {
    body: { query: gql, variables },
  });

  expect((res as { errors: { message: string }[] }).errors![0].message).toMatch(
    'Unauthorized',
  );
};

export const testIfAccessTokenIsInvalidQuery = async (
  server,
  gql,
  variables?: object,
) => {
  const res = await testRoute(server, '/graphql', 'POST', {
    body: { query: gql, variables },
    headers: {
      authorization: 'Bearer badToken',
    },
  });

  expect((res as { errors: { message: string }[] }).errors![0].message).toMatch(
    'Unauthorized',
  );
};

export const testIfMutationIsProtected = async (server, gql, variables) => {
  const res = await testRoute(server, '/graphql', 'POST', {
    body: { query: gql, variables },
  });

  expect((res as { errors: { message: string }[] }).errors![0].message).toMatch(
    'Unauthorized',
  );
};

export const testIfAccessTokenIsInvalidMutation = async (
  server,
  gql,
  variables,
) => {
  const res = await testRoute(server, '/graphql', 'POST', {
    body: { query: gql, variables },
    headers: {
      authorization: 'Bearer badToken',
    },
  });

  expect((res as { errors: { message: string }[] }).errors![0].message).toMatch(
    'Unauthorized',
  );
};

export const testPasswordValidation = async (
  server,
  gql,
  variables,
  passwordPath,
) => {
  const tweakPassword = (value) =>
    set(
      {
        ...variables,
      },
      `${passwordPath}`,
      value,
    );

  const tooShort = tweakPassword('short');
  const resShort = await testGQL(server, gql, tooShort);
  expect(resShort.errors![0].message).toMatch('Bad Request');
  expect(resShort.errors![0].extensions?.context).toMatchObject({
    error: AuthErrors.password_validation_error,
  });

  const tooLong = tweakPassword('veeeerrrrryyyyyylooooooonnnnggggg');
  const resLong = await testGQL(server, gql, tooLong);
  expect(resLong.errors![0].message).toMatch('Bad Request');
  expect(resLong.errors![0].extensions?.context).toMatchObject({
    error: AuthErrors.password_validation_error,
  });
};

export const testGQL = async (server, gql, variables, token?: string) => {
  logger.error({ gql, variables, token }, 'testGQL');

  const res = await testRoute(server, '/graphql', 'POST', {
    body: { query: gql, variables },
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

  return res as {
    data?: Record<string, unknown>;
    errors?:
      | {
          message: string;
          extensions?: { context: { error?: string; code?: string } };
        }[]
      | undefined;
  };
};
