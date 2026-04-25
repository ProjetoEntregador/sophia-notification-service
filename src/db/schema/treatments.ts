import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';

export const treatments = pgTable('treatments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  medicineName: varchar('medicine_name', { length: 255 }).notNull(),
  intervalHours: integer('interval_hours').notNull(),
  startTime: timestamp('start_time', {
    withTimezone: true,
  }).notNull(),
  endTime: timestamp('end_time', {
    withTimezone: true,
  }).notNull(),
});
