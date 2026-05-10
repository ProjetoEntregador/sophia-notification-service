export type CreateMedicationInput = {
  userId: string;
  jid: string;
  name: string;
  quantity: number;
};

export type UpdateMedicationInput = Partial<CreateMedicationInput>;
