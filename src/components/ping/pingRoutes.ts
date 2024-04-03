import { Stream } from '@elysiajs/stream';

import { ElysiaServer } from '../../server';

export const pingRoutes = (server: ElysiaServer) => {
  const app = server
    .get('', () => ({
      ping: 'pong',
    }))
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
    );

  return app;
};
