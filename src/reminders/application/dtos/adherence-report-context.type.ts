import { Reminder } from '@/reminders/domain/reminder.entity';

export type AdherenceReportContext = {
  reminders: Reminder[];
  treatmentToMedIds: Map<string, string[]>;
  medNameById: Map<string, string>;
};

export type AdherenceDateRange = {
  from: Date;
  until: Date;
};
