import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { newId } from '../idGeneration';

export const Users = pgTable(
  'users',
  {
    id: text('id')
      .notNull()
      .$defaultFn(() => {
        return newId('users');
      })
      .primaryKey(),

    firstName: text('first_name').notNull(),
    lastName: text('last_name'),

    email: text('email').notNull().unique(),

    password: text('password').notNull(),
    resetPasswordCode: text('reset_password_code'),

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
