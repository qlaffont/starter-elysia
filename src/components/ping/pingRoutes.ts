import { ElysiaServer } from '../../server';

export const pingRoutes = (server: ElysiaServer) => {
  return server.get('', () => ({
    ping: 'pong',
  }));
};
