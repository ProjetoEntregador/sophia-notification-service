import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from '@/users/adapters/out/user.schema';

export const treatments = pgTable('treatments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  intervalHours: integer('interval_hours').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
});
