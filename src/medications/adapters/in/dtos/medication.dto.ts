export type CreateMedicationDto = {
  id: string;
  userId: string;
  name: string;
  quantity: number;
};

export type UpdateMedicationDto = Partial<CreateMedicationDto>;
