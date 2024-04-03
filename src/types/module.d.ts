/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-namespace */
import { Logger } from 'pino';

import { env as ENV } from '../services/env';

declare global {
  namespace globalThis {
    var logger: Logger<never>;
    var env: typeof ENV;
  }
}
