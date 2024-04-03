import { Users } from '@db/schemas';
import { createParamDecorator } from 'type-graphql';

export function CurrentUser() {
  return createParamDecorator<{ user: typeof Users.$inferSelect }>(
    ({ context }) => context.user as typeof Users.$inferSelect,
  );
}
