import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { treatments } from '../db/schema/treatments';

export type Treatment = InferSelectModel<typeof treatments>;
export type NewTreatment = InferInsertModel<typeof treatments>;

export type CreateTreatmentInput = {
  userId: string;
  jid: string;
  intervalHours: number;
  startTime: string;
  endTime: string;
  medicationsIds: string[];
};

export type UpdateTreatmentInput = Partial<CreateTreatmentInput>;

export type CreateTreatmentDto = {
  userId: string;
  jid: string;
  intervalHours: number;
  startTime: string;
  endTime: string;
  medicationsIds: string[];
};

export type UpdateTreatmentDto = Partial<CreateTreatmentDto>;

export type TreatmentDraft = Partial<{
  intervalHours: number;
  startTime: string;
  endTime: string;
  medications: string[];
}>;

export type TreatmentStepResult =
  | { kind: 'reject'; reply: string }
  | { kind: 'advance'; patch: TreatmentDraft }
  | { kind: 'commit' };

export type TreatmentStep = {
  prompt: (draft: TreatmentDraft) => string;
  process: (input: string, draft: TreatmentDraft) => TreatmentStepResult;
};
