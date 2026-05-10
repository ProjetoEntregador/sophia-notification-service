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
