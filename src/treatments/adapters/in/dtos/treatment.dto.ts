export type CreateTreatmentDto = {
  userId: string;
  intervalHours: number;
  startTime: string;
  endTime: string;
  medicationsIds: string[];
};

export type UpdateTreatmentDto = Partial<CreateTreatmentDto>;
