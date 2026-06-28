export type CreateMedicationInput = {
  userId: string;
  name: string;
  quantity: number;
};

export type UpdateMedicationInput = {
  name?: string;
  quantity?: number;
};
