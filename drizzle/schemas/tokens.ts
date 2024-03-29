import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { Users } from './users';

export const Tokens = pgTable(
  'tokens',
  {
    id: uuid('id').notNull().defaultRandom(),

    ownerId: uuid('owner_id')
      .notNull()
      .references(() => Users.id),

    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (tokens) => ({
    idIdx: index('tokens_id_idx').on(tokens.id),
  }),
);

// export const tokensRelations = relations(tokens, ({ one }) => ({
//   owner: one(users, {
//     fields: [tokens.ownerId],
//     references: [users.id],
//   }),
// }));
