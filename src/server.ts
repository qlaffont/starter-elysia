import 'reflect-metadata';

import { db } from '@db/connection';
import { Tokens, Users } from '@db/schemas';
import { cors } from '@elysiajs/cors';
import { serverTiming } from '@elysiajs/server-timing';
import Elysia from 'elysia';
import { elysiaAuthDrizzlePlugin, ElysiaUrlConfig } from 'elysia-auth-drizzle';
import { helmet } from 'elysia-helmet';
import { pluginGracefulServer } from 'graceful-server-elysia';
import { pluginUnifyElysia } from 'unify-elysia';

import { loadGraphQL } from './loader/GraphQLLoader';
import { loadREST } from './loader/RESTLoader';
import { isDevelopmentEnv } from './services/env';

export const runServer = async () => {
  const origin = isDevelopmentEnv() ? true : /(myapp\.qlaffont\.com)$/;

  const server = new Elysia()
    .use(
      pluginGracefulServer({
        serverIsReadyOnStart: true,
      }),
    )
    .use(
      pluginUnifyElysia({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        logInstance: global.logger,
      }),
    )
    .use(
      cors({
        methods: ['GET', 'PUT', 'DELETE', 'POST', 'OPTIONS', 'PATCH'],
        allowedHeaders: [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
          'forest-context-url',
          'Set-Cookie',
          'set-cookie',
          'Cookie',
        ],
        origin,
        credentials: true,
      }),
    )
    .use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: [`'self'`],
            imgSrc: [`data:`, `https:`],
            objectSrc: [`'none'`],
            scriptSrc: [
              `cdn.jsdelivr.net`,
              `stackpath.bootstrapcdn.com`,
              'unpkg.com',
              `'self'`,
              `'unsafe-inline'`,
            ],
            styleSrc: [
              `fonts.googleapis.com`,
              `stackpath.bootstrapcdn.com`,
              'unpkg.com',
              `'self'`,
              `'unsafe-inline'`,
            ],
          },
        },
      }),
    )
    .use(
      serverTiming({
        enabled: isDevelopmentEnv(),
      }),
    )
    .use(
      elysiaAuthDrizzlePlugin<typeof Users.$inferSelect>({
        config: [
          ...((isDevelopmentEnv()
            ? [
                {
                  url: '/swagger/*',
                  method: '*',
                },
                {
                  url: '/swagger',
                  method: '*',
                },
              ]
            : []) as ElysiaUrlConfig[]),
          {
            url: '/graphql',
            method: '*',
          },
          {
            url: '/ready',
            method: 'GET',
          },
          {
            url: '/live',
            method: 'GET',
          },
        ],
        jwtSecret: global.env.JWT_ACCESS_SECRET,
        cookieSecret: global.env.COOKIE_SECRET,
        drizzle: {
          db: db,
          usersSchema: Users,
          tokensSchema: Tokens,
        },
      }),
    );

  await loadREST(server);
  await loadGraphQL(server);

  return server;
};

export type ElysiaServer = Awaited<ReturnType<typeof runServer>>;
