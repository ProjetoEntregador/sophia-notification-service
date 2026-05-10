import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core';

export const medications = pgTable('medications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  jid: varchar('jid', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
});
