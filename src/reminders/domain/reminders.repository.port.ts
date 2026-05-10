import { Reminder } from './reminder.entity';
import { DueReminderProjection } from './due-reminder.projection';

export abstract class RemindersRepository {
  abstract findAll(): Promise<Reminder[]>;
  abstract findById(id: string): Promise<Reminder | null>;
  abstract findInDay(day: Date): Promise<Reminder[]>;
  abstract findInDateRange(start: Date, end: Date): Promise<Reminder[]>;
  abstract findOldestUnresolved(): Promise<Reminder | null>;
  abstract findExpired(now: Date, graceMinutes: number): Promise<Reminder[]>;
  abstract findDue(now: Date): Promise<DueReminderProjection[]>;

  abstract save(reminder: Reminder): Promise<Reminder>;
  abstract delete(id: string): Promise<boolean>;

  // Cross-aggregate: cria o próximo reminder do tratamento a partir do reminder atual,
  // estendendo o endTime do tratamento se a próxima dose ultrapassar o término.
  abstract scheduleNextAfter(reminder: Reminder): Promise<Reminder | null>;
}
