import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { newId } from '../idGeneration';
import { Users } from './users';

export const Tokens = pgTable(
  'tokens',
  {
    id: text('id')
      .notNull()
      .$defaultFn(() => {
        return newId('tokens');
      })
      .primaryKey(),

    ownerId: text('owner_id')
      .notNull()
      .references(() => Users.id, { onDelete: 'cascade' }),

    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (tokens) => ({
    idIdx: index('tokens_id_idx').on(tokens.id),
  }),
);
