import type { Users } from '@db/schemas';
import { createMethodMiddlewareDecorator } from 'type-graphql';
import { Unauthorized } from 'unify-errors';

export function Authorized() {
  return createMethodMiddlewareDecorator<{ user: typeof Users.$inferSelect }>(
    async ({ context }, next) => {
      if (!context.user) {
        throw new Unauthorized();
      }
      return next();
    },
  );
}
