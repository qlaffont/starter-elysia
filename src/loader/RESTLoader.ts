import swagger from '@elysiajs/swagger';
import { rateLimit } from 'elysia-rate-limit';
import { startCase } from 'lodash';

import { AuthRoutes } from '../components/auth/authRoutes';
import { PingRoutes } from '../components/ping/pingRoutes';
import type { ElysiaServer } from '../server';
import { isDevelopmentEnv } from '../services/env';

export const loadREST = async (app: ElysiaServer) => {
  let server = app;

  const routes = [
    {
      '/ping': PingRoutes,
    },
    {
      '/auth': AuthRoutes,
    },
  ];

  for (const route of routes) {
    const [[prefix, fastifyRoutes]] = Object.entries(route);
    //@ts-ignore
    server = server.group(prefix, (app) => fastifyRoutes(app));
    const routeName = startCase(prefix.substring(1).replaceAll('/', ' '));
    logger.info(`[REST] ${routeName} Routes loaded (${prefix})`);
  }

  // Swagger
  const pkg = require('../../package.json');

  const softName = pkg?.name;

  if (isDevelopmentEnv()) {
    //@ts-ignore
    server = server.use(
      swagger({
        documentation: {
          info: {
            title: softName as string,
            description: `Swagger Doc for ${softName}`,
            version: pkg?.version,
          },
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
            },
          },
        },
      }),
    );
  }

  return server;
};
