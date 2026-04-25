import { relations } from 'drizzle-orm';
import { treatments } from './schema/treatments';
import { reminders } from './schema/reminders';

export const treatmentRelations = relations(treatments, ({ many }) => ({
  reminders: many(reminders),
}));

export const reminderRelations = relations(reminders, ({ one }) => ({
  treatment: one(treatments, {
    fields: [reminders.treatmentId],
    references: [treatments.id],
  }),
}));
