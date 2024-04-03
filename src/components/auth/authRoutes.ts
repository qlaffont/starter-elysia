/* eslint-disable @typescript-eslint/no-empty-function */

import { t } from 'elysia';

import { ElysiaServer } from '../../server';
import AuthController from './authController';
import { JWTRequiredSchema } from './authSchema';

export const AuthRoutes = function (server: ElysiaServer) {
  let app = server;

  app = app.post(
    '/login',
    async ({ cookie, body }) => {
      return AuthController.login(
        { email: body.email, password: body.password },
        cookie,
      );
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
      detail: {
        description: 'Login with email & password',
        tags: ['Auth'],
      },
    },
  );

  app = app.post(
    '/logout',
    async (req) => {
      return AuthController.logout(req);
    },
    {
      detail: {
        description: 'Refresh Token - Refresh token in session required',
        tags: ['Auth'],
        ...JWTRequiredSchema,
      },
    },
  );

  app = app.post(
    '/refresh',
    async (req) => {
      return AuthController.refresh(req);
    },
    {
      detail: {
        description: 'Signout',
        tags: ['Auth'],
      },
    },
  );

  app = app.get(
    '/info',
    async ({ connectedUser }) => {
      return AuthController.getUserInfo(connectedUser!);
    },
    {
      detail: {
        description: 'User Info',
        tags: ['Auth'],
        ...JWTRequiredSchema,
      },
    },
  );

  return app;
};
