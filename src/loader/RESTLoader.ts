import swagger from '@elysiajs/swagger';
import { rateLimit } from 'elysia-rate-limit';
import { startCase } from 'lodash';

import { AuthRoutes } from '../components/auth/authRoutes';
import { PingRoutes } from '../components/ping/pingRoutes';
import type { ElysiaServer } from '../server';
import { isDevelopmentEnv, isTestEnv } from '../services/env';

export const loadREST = async (app: ElysiaServer) => {
  let server = app.use(
    rateLimit({
      duration: 60 * 1000,
      max: 5,
      countFailedRequest: true,
      responseCode: 429,
      responseMessage: 'Too many requests, please try again later',
      skip: (request) => {
        const urls = [
          '/swagger',
          '/graphql',
          '/documentation/json',
          '/live',
          '/ready',
        ];

        for (const url of urls) {
          const urlClean = request.url.split('?')[0];
          if (urlClean.endsWith(url)) {
            return true;
          }
        }

        //Disable rate limit for test
        if (isTestEnv()) {
          return true;
        }

        return false;
      },
    }),
  );

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
