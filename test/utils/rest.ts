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
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  server: any,
  routePath: string,
  method: HTTPMethods,
  data: {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    headers?: Record<string, any>;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    body?: Record<string, any>;
  },
  validation?: {
    supposedStatus?: number;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    supposedMessage?: string | Record<string, any>;
    notSupposedStatus?: number;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
        } catch (_error) {}

        try {
          content = await res.text();
          return;
        } catch (_error) {}

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
