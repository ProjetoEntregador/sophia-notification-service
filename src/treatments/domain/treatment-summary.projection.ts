import { Treatment } from './treatment.entity';

export type TreatmentSummaryProjection = {
  treatment: Treatment;
  medicationNames: string[];
  totals: {
    sent: number;
    confirmed: number;
    skipped: number;
    pending: number;
  };
};
