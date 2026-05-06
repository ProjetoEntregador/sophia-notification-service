import { InferSelectModel } from 'drizzle-orm';
import { treatmentsToMedications } from 'src/db/schema/treatmentsToMedications';

export type TreatmentToMedication = InferSelectModel<
  typeof treatmentsToMedications
>;

export type CreateTreatmentToMedication = {
  treatmentId: string;
  medicationId: string;
};

export type UpdateTreatmentInput = Partial<CreateTreatmentToMedication>;

export type CreateTreatmentToMedicationDto = {
  treatmentId: string;
  medicationId: string;
};

export type UpdateTreatmentToMedicationDto =
  Partial<CreateTreatmentToMedicationDto>;
