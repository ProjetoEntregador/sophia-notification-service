import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { medications } from 'src/db/schema/medications';

export type Medication = InferSelectModel<typeof medications>;
export type NewMedication = InferInsertModel<typeof medications>;

export type CreateMedicationInput = {
  userId: string;
  jid: string;
  name: string;
  quantity: number;
};

export type UpdateMedicationInput = Partial<CreateMedicationInput>;

export type CreateMedicationDto = {
  id: string;
  userId: string;
  jid: string;
  name: string;
  quantity: number;
};

export type UpdateMedicationDto = Partial<CreateMedicationDto>;

export type MedicationStatus = {
  lastConsumptionDate: Date | null;
  quantity: number;
};
