import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { treatments } from '../db/schema/treatments';

export type Treatment = InferSelectModel<typeof treatments>;
export type NewTreatment = InferInsertModel<typeof treatments>;

export type CreateTreatmentInput = {
  userId: string;
  jid: string;
  medicineName: string;
  intervalHours: number;
  startTime: string;
  endTime: string;
};

export type UpdateTreatmentInput = Partial<CreateTreatmentInput>;

export type CreateTreatmentDto = {
  userId: string;
  jid: string;
  medicineName: string;
  intervalHours: number;
  startTime: string;
  endTime: string;
};

export type UpdateTreatmentDto = Partial<CreateTreatmentDto>;

export type TreatmentDraft = Partial<{
  medicineName: string;
  intervalHours: number;
  startTime: string;
  endTime: string;
}>;

export type TreatmentStepResult =
  | { kind: 'reject'; reply: string }
  | { kind: 'advance'; patch: TreatmentDraft }
  | { kind: 'commit' };

export type TreatmentStep = {
  prompt: (draft: TreatmentDraft) => string;
  process: (input: string, draft: TreatmentDraft) => TreatmentStepResult;
};
