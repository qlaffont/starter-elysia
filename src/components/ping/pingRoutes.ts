import { Stream } from '@elysiajs/stream';

import { ElysiaServer } from '../../server';
import { JWTRequiredSchema } from '../auth/authSchema';

export const PingRoutes = (server: ElysiaServer) => {
  const app = server
    .get(
      '',
      () => ({
        ping: 'pong',
      }),
      {
        detail: {
          description:
            'Get pong to check if the server is up and running (Required Token)',
          ...JWTRequiredSchema,
        },
      },
    )
    .get(
      '/sse',
      () =>
        new Stream(async (stream) => {
          stream.send(JSON.stringify({ message: 'Test sample for SSE' }));

          await stream.wait(1000);
          stream.send(JSON.stringify({ message: 'Test sample for SSE' }));
          await stream.wait(1000);
          stream.send({ message: 'SSE Completed' });

          stream.close();
        }),
      {
        detail: {
          description: 'Server-Sent Events (SSE) example',
        },
      },
    );

  return app;
};
