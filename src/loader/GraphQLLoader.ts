/* eslint-disable @typescript-eslint/ban-ts-comment */
import { yoga } from '@elysiajs/graphql-yoga';
import { buildTypeDefsAndResolvers } from 'type-graphql';

import { PingResolver } from '../components/ping/pingResolver';
import { ElysiaServer } from '../server';
import { isDevelopmentEnv } from '../services/env';

export const loadGraphQL = async (server: ElysiaServer) => {
  const resolvers = [PingResolver];

  for (const resolver of resolvers) {
    //@ts-ignore
    logger.info(`[GQL] ${resolver.name} Query & Mutations loaded`);
  }

  return server.use(
    yoga({
      ...(await buildTypeDefsAndResolvers({
        //@ts-ignore
        resolvers,
      })),
      graphiql: isDevelopmentEnv(),
    }),
  );
};
