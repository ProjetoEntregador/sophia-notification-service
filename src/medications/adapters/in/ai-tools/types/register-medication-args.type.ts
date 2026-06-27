export type RegisterMedicationArgs = {
  name?: unknown;
  quantity?: unknown;
};

export type ValidatedMedication = {
  name: string;
  quantity: number;
};

export type RegisterMedicationValidation =
  | { error: string }
  | ValidatedMedication;
