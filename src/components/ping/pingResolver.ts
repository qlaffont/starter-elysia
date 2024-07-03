import {
  Field,
  ID,
  ObjectType,
  Query,
  Resolver,
  Root,
  Subscription,
} from 'type-graphql';
import { Topic, pubSub } from './pubsub';

@ObjectType()
class Ping {}

@ObjectType()
export class Notification {
  @Field((_type) => ID)
  id!: number;

  @Field(() => String, { nullable: true })
  message?: string;

  @Field((_type) => Date)
  date!: Date;
}

export interface NotificationPayload {
  id: number;

  message?: string;
}

@Resolver(() => Ping)
export class PingResolver {
  @Query(() => String)
  async ping(): Promise<string> {
    const payload: NotificationPayload = {
      id: 123,
      message: 'test',
    };
    pubSub.publish(Topic.NOTIFICATIONS, payload);

    return 'Pong !';
  }

  @Subscription(() => Notification, { topics: Topic.NOTIFICATIONS })
  normalSubscription(
    @Root() { id, message }: NotificationPayload,
  ): Notification {
    return { id, message, date: new Date() };
  }
}
