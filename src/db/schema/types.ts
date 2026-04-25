import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { treatments } from './treatments';
import { reminders } from './reminders';

export type Treatment = InferSelectModel<typeof treatments>;
export type NewTreatment = InferInsertModel<typeof treatments>;

export type Reminder = InferSelectModel<typeof reminders>;
export type NewReminder = InferInsertModel<typeof reminders>;
