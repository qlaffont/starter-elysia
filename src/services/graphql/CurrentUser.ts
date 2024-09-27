import type { Users } from '@db/schemas';
import { createParameterDecorator } from 'type-graphql';

export function CurrentUser() {
  return createParameterDecorator<{ user: typeof Users.$inferSelect }>(
    ({ context }) => {
      return context.user as typeof Users.$inferSelect;
    },
  );
}
