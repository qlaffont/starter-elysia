/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-namespace */
import { Cookie } from 'elysia';
import { Logger } from 'pino';

import { env as ENV } from '../services/env';

declare global {
  namespace globalThis {
    var logger: Logger<never>;
    var env: typeof ENV;
  }
}

//Ref : https://github.com/elysiajs/elysia/blob/main/src/context.ts#L50
export type ElysiaCookie = Record<string, Cookie<any>>;

export type ElysiaRequest = {
  cookie?: ElysiaCookie;
  query?: Record<string, string | undefined> | undefined;
  params?: Record<string, string | undefined> | undefined;
  body?: Record<string, string | undefined> | undefined | unknown;
  headers: Record<string, string | undefined>;
};
