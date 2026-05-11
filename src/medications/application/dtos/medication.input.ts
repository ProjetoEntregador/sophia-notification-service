export type CreateMedicationInput = {
  userId: string;
  name: string;
  quantity: number;
};

export type UpdateMedicationInput = Partial<CreateMedicationInput>;
