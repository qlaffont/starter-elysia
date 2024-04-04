/* eslint-disable @typescript-eslint/ban-ts-comment */
import { db } from '@db/connection';
import { Tokens, Users } from '@db/schemas';
import { yoga } from '@elysiajs/graphql-yoga';
import {
  checkTokenValidity,
  getAccessTokenFromRequest,
} from 'elysia-auth-drizzle';
import { buildTypeDefsAndResolvers } from 'type-graphql';
import { pluginUnifyElysiaGraphQL } from 'unify-elysia-gql';

import { HTTPMethods } from '../../test/utils/rest';
import { AuthResolver } from '../components/auth/authResolver';
import { PingResolver } from '../components/ping/pingResolver';
import { ElysiaServer } from '../server';
import { isDevelopmentEnv } from '../services/env';

const parseCookie = (str) => {
  if (str?.length > 1) {
    return str
      .split(';')
      .map((v) => v.split('='))
      .reduce((acc, v) => {
        acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
        return acc;
      }, {});
  }
  return {};
};

export const loadGraphQL = async (server: ElysiaServer) => {
  const resolvers = [PingResolver, AuthResolver];

  for (const resolver of resolvers) {
    //@ts-ignore
    logger.info(`[GQL] ${resolver.name} Query & Mutations loaded`);
  }

  const { handleQueryAndResolver } = pluginUnifyElysiaGraphQL({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    logInstance: global.logger,
    disableDetails: !isDevelopmentEnv(),
  });

  return server.use(
    yoga({
      ...(await buildTypeDefsAndResolvers({
        //@ts-ignore
        resolvers: resolvers,
        globalMiddlewares: [
          async (result, next) => {
            return handleQueryAndResolver(next)();
          },
        ],
        authChecker: ({ context }) => {
          return !!context.user;
        },
      })),
      graphiql: isDevelopmentEnv(),
      context: async ({ request }) => {
        const context: { user? } = {};

        const req = {
          headers: {},
          query: {},
          cookie: parseCookie(request.headers.get('cookie') || ''),
          url: new URL(request.url).pathname,
          method: request.method as HTTPMethods,
        };

        for (const iterator of new URLSearchParams(request.url).entries()) {
          req.query[iterator[0]] = iterator[1];
        }
        for (const iterator of request.headers.entries()) {
          req.headers[iterator[0]] = iterator[1];
        }

        try {
          const tokenValue: string | undefined =
            await getAccessTokenFromRequest(req, global.env.COOKIE_SECRET);

          const res = await checkTokenValidity(
            {
              jwtSecret: global.env.JWT_ACCESS_SECRET,
              cookieSecret: global.env.COOKIE_SECRET,
              drizzle: {
                db,
                usersSchema: Users,
                tokensSchema: Tokens,
              },
              config: [],
            },
            req.url,
            req.method as HTTPMethods,
            {},
          )(tokenValue);

          if (res) {
            context.user = res.connectedUser;
          }
          // eslint-disable-next-line no-empty
        } catch (error) {}

        return context;
      },
    }),
  );
};
