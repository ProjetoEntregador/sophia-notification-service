export type CreateMedicationDto = {
  id: string;
  userId: string;
  jid: string;
  name: string;
  quantity: number;
};

export type UpdateMedicationDto = Partial<CreateMedicationDto>;
