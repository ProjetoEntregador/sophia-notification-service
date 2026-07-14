import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { users } from '@/users/adapters/out/user.schema';

export const medications = pgTable('medications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
});
