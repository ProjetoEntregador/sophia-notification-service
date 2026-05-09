import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { reminders } from '../db/schema/reminders';

export type Reminder = InferSelectModel<typeof reminders>;
export type NewReminder = InferInsertModel<typeof reminders>;

export type CreateReminderInput = {
  treatmentId: string;
  scheduledTime: string | Date;
  sent?: boolean;
  sentAt?: string | null;
  confirmed?: boolean | null;
  confirmedAt?: string | null;
};

export type UpdateReminderInput = Partial<CreateReminderInput>;

export type CreateReminderDto = {
  treatmentId: string;
  scheduledTime: string;
  sent?: boolean;
  sentAt?: string | null;
  confirmed?: boolean | null;
  confirmedAt?: string | null;
};

export type UpdateReminderDto = Partial<CreateReminderDto>;

export type DelayReminder = {
  delay: number;
};

export type RemindersInBetween = {
  start: Date;
  end: Date;
};

export type DueReminder = {
  reminderId: string;
  jid: string;
  medicationNames: string[];
  previousSkipped: boolean;
};

export type GroupedDueReminderInterface = {
  jid: string;
  medicationNames: string[];
  treatmentId: string;
  scheduledTime: Date;
};

export type DueReminderRow = {
  reminderId: string;
  treatmentId: string;
  scheduledTime: Date;
  jid: string;
  medicationName: string;
};
