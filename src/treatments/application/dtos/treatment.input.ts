export type CreateTreatmentInput = {
  userId: string;
  jid: string;
  intervalHours: number;
  startTime: string;
  endTime: string;
  medicationsIds: string[];
};

export type UpdateTreatmentInput = Partial<CreateTreatmentInput>;
