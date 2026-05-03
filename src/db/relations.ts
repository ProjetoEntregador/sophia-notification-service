import { relations } from 'drizzle-orm';
import { treatments } from './schema/treatments';
import { reminders } from './schema/reminders';
import { medications } from './schema/medications';
import { treatmentsToMedications } from './schema/treatmentsToMedications';

export const treatmentRelations = relations(treatments, ({ many }) => ({
  reminders: many(reminders),
  medications: many(medications),
}));

export const reminderRelations = relations(reminders, ({ one }) => ({
  treatment: one(treatments, {
    fields: [reminders.treatmentId],
    references: [treatments.id],
  }),
}));

export const medicationRelations = relations(medications, ({ many }) => ({
  treatments: many(treatments),
}));

export const treatmentToMedicationRelations = relations(
  treatmentsToMedications,
  ({ one }) => ({
    medication: one(medications, {
      fields: [treatmentsToMedications.medicationId],
      references: [medications.id],
    }),
    treatment: one(treatments, {
      fields: [treatmentsToMedications.treatmentId],
      references: [treatments.id],
    }),
  }),
);
