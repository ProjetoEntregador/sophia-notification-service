import { pgTable, uuid, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { treatments } from '../../../treatments/adapters/out/treatment.schema';

export const reminders = pgTable(
  'reminders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    treatmentId: uuid('treatment_id')
      .references(() => treatments.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    scheduledTime: timestamp('scheduled_time', {
      withTimezone: true,
    }).notNull(),
    sent: boolean('sent').default(false).notNull(),
    sentAt: timestamp('sent_at', {
      withTimezone: true,
    }),
    confirmed: boolean('confirmed'),
    confirmedAt: timestamp('confirmed_at', {
      withTimezone: true,
    }),
  },
  (table) => ({
    scheduledIndex: index('reminders_scheduled_time_idx').on(
      table.scheduledTime,
    ),
    sentIndex: index('reminders_sent_idx').on(table.sent),
    treatmentIndex: index('reminders_treatment_idx').on(table.treatmentId),
  }),
);
