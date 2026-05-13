import { Reminder } from './reminder.entity';
import { DueReminderProjection } from './due-reminder.projection';

export abstract class RemindersRepository {
  abstract findAll(): Promise<Reminder[]>;
  abstract findById(id: string): Promise<Reminder | null>;
  abstract findInDay(day: Date): Promise<Reminder[]>;
  abstract findInDateRange(start: Date, end: Date): Promise<Reminder[]>;
  abstract findOldestUnresolved(userId?: string): Promise<Reminder | null>;
  abstract findExpired(now: Date, graceMinutes: number): Promise<Reminder[]>;
  abstract findDue(now: Date): Promise<DueReminderProjection[]>;
  abstract findByUserIdAndDay(userId: string, day: Date): Promise<Reminder[]>;
  abstract findUpcomingByUserId(
    userId: string,
    from: Date,
    until: Date,
  ): Promise<Reminder[]>;
  abstract findByTreatmentId(treatmentId: string): Promise<Reminder[]>;
  abstract deleteFutureUnsentByTreatmentId(
    treatmentId: string,
  ): Promise<number>;

  abstract save(reminder: Reminder): Promise<Reminder>;
  abstract delete(id: string): Promise<boolean>;
}
