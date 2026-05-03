import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { reminders } from '../db/schema/reminders';

export type Reminder = InferSelectModel<typeof reminders>;
export type NewReminder = InferInsertModel<typeof reminders>;

export type CreateReminderInput = {
  treatmentId: string;
  scheduledTime: string;
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
