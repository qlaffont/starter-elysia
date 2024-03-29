import { ObjectType, Query, Resolver } from 'type-graphql';

@ObjectType()
class Ping {}

@Resolver(() => Ping)
export class PingResolver {
  @Query(() => String)
  async ping(): Promise<string> {
    return 'Pong !';
  }
}
