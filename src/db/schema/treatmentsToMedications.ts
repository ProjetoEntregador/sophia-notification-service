import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { treatments } from './treatments';
import { medications } from './medications';

export const treatmentsToMedications = pgTable(
  'treatments_to_medications',
  {
    treatmentId: uuid('treatment_id')
      .notNull()
      .references(() => treatments.id),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medications.id),
  },
  (t) => [primaryKey({ columns: [t.medicationId, t.treatmentId] })],
);
