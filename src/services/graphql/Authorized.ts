import { Users } from '@db/schemas';
import { createMethodDecorator } from 'type-graphql';
import { Unauthorized } from 'unify-errors';

export function Authorized() {
  return createMethodDecorator<{ user: typeof Users.$inferSelect }>(
    async ({ context }, next) => {
      if (!context.user) {
        throw new Unauthorized();
      }
      return next();
    },
  );
}
