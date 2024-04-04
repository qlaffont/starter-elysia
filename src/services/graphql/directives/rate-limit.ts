import { rateLimitDirective as rld } from 'graphql-rate-limit-directive';
import { Directive } from 'type-graphql';

import {
  isDevelopmentEnv,
  isPreProductionEnv,
  isProductionEnv,
} from '../../../services/env';
import Conditional from './conditional';

const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } = rld();

export const rateLimitDirective = {
  typeDefs: rateLimitDirectiveTypeDefs,
  transformer: rateLimitDirectiveTransformer,
};

export function RateLimitDirective(limit = 5, duration = 60) {
  return Conditional(
    (isProductionEnv() || isPreProductionEnv()) as boolean,
    Directive(`@rateLimit(limit: ${limit}, duration: ${duration})`),
  ) as MethodDecorator;
}
