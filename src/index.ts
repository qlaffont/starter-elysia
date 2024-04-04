import pino from 'pino';

import { runServer } from './server';
import { currentEnv, env, isProductionEnv } from './services/env';

(async () => {
  global.env = env;

  const logLevel = global.env.LOG || 'info';
  const logger = pino({ level: logLevel });
  global.logger = logger;

  const elysia = await runServer();

  elysia.listen({ port: global.env.PORT, hostname: '0.0.0.0' }, (app) => {
    logger.info(`Listening http://0.0.0.0:${app.port}`);
    logger.info(`Server Running on ${currentEnv()} mode`);
    logger.info(`Log Running on ${logLevel} mode`);

    if (!isProductionEnv()) {
      logger.info('REST Documentation available in /swagger');
      logger.info('GQL Documentation available in /graphql');
    }
  });
})();
