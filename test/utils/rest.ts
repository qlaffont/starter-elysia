/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expect } from 'bun:test';

export type HTTPMethods =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'OPTIONS'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'MKCOL'
  | 'COPY'
  | 'MOVE'
  | 'LOCK'
  | 'UNLOCK'
  | 'TRACE'
  | 'SEARCH';

export const testRoute = async (
  server: any,
  routePath: string,
  method: HTTPMethods,
  data: {
    headers?: Record<string, any>;
    body?: Record<string, any>;
  },
  validation?: {
    supposedStatus?: number;
    supposedMessage?: string | Record<string, any>;
    notSupposedStatus?: number;
    notSupposedMessage?: string | Record<string, any>;
  },
): Promise<unknown> => {
  let status: number;
  let content: Record<string, unknown> | string | undefined | null;
  let json = false;

  await server
    .handle(
      new Request(`http://localhost${routePath}`, {
        headers: {
          ...(data?.headers || {}),
          ...(data?.body && { 'Content-Type': 'application/json' }),
        },
        method: method,
        body: data?.body ? JSON.stringify(data.body) : undefined,
      }),
    )
    .then(
      async (res: {
        status: number;
        json: () =>
          | string
          | Record<string, unknown>
          | PromiseLike<string | Record<string, unknown> | null | undefined>
          | null
          | undefined;
        text: () =>
          | string
          | Record<string, unknown>
          | PromiseLike<string | Record<string, unknown> | null | undefined>
          | null
          | undefined;
      }) => {
        status = res.status;

        try {
          content = await res.json();
          json = true;
          return;
          // eslint-disable-next-line no-empty
        } catch (error) {}

        try {
          content = await res.text();
          return;
          // eslint-disable-next-line no-empty
        } catch (error) {}

        return;
      },
    );

  if (validation?.supposedMessage) {
    if (json) {
      //@ts-ignore
      expect(content).toMatchObject(validation.supposedMessage);
    } else {
      //@ts-ignore
      expect(content).toEqual(validation.supposedMessage);
    }
  }

  if (validation?.supposedStatus) {
    expect(status!).toBe(validation.supposedStatus);
  }

  if (validation?.notSupposedMessage) {
    if (json) {
      //@ts-ignore
      expect(content).not.toMatchObject(validation.notSupposedMessage);
    } else {
      //@ts-ignore
      expect(content).not.toEqual(validation.notSupposedMessage);
    }
  }

  if (validation?.notSupposedStatus) {
    expect(status!).not.toBe(validation.notSupposedStatus);
  }

  return content;
};
