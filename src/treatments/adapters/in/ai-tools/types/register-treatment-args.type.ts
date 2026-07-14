export type RegisterTreatmentArgs = {
  medications?: unknown;
  intervalHours?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  durationDays?: unknown;
};

export type ValidatedTreatment = {
  medications: string[];
  intervalHours: number;
  start: Date;
  end: Date;
};

export type RegisterTreatmentValidation =
  | { error: string }
  | ValidatedTreatment;
