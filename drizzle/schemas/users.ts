import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const Users = pgTable(
  'users',
  {
    id: uuid('id').notNull().defaultRandom().primaryKey(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => {
        return new Date();
      }),
  },
  (users) => ({
    idIdx: index('user_id_idx').on(users.id),
  }),
);

// export const usersRelations = relations(users, ({ many }) => ({
//   tokens: many(tokens),
// }));
