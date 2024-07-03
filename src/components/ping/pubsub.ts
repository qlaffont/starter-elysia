import { createPubSub } from '@graphql-yoga/subscription';
import type { NotificationPayload } from './pingResolver';

export enum Topic {
  NOTIFICATIONS = 'NOTIFICATIONS',
}

export const pubSub = createPubSub<
  {
    [Topic.NOTIFICATIONS]: [NotificationPayload];
  } & Record<string, [NotificationPayload]> // Fallback for dynamic topics
>();
