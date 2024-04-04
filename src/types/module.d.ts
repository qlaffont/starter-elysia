import type { Cookie } from 'elysia';
import type { Logger } from 'pino';

import type { env as ENV } from '../services/env';

declare global {
  namespace globalThis {
    var logger: Logger<never>;
    var env: typeof ENV;
  }
}

//Ref : https://github.com/elysiajs/elysia/blob/main/src/context.ts#L50
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type ElysiaCookie = Record<string, Cookie<any>>;

export type ElysiaRequest = {
  cookie?: ElysiaCookie;
  query?: Record<string, string | undefined> | undefined;
  params?: Record<string, string | undefined> | undefined;
  body?: Record<string, string | undefined> | undefined | unknown;
  headers: Record<string, string | undefined>;
};
