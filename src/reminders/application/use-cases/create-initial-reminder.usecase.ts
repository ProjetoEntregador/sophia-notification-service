import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Reminder } from '../../domain/reminder.entity';
import { RemindersRepository } from '../../domain/reminders.repository.port';

@Injectable()
export class CreateInitialReminderUseCase {
  constructor(private readonly reminders: RemindersRepository) {}

  async execute(treatmentId: string, scheduledTime: Date): Promise<Reminder> {
    const reminder = new Reminder(
      randomUUID(),
      treatmentId,
      scheduledTime,
      false,
      null,
      null,
      null,
    );
    return this.reminders.save(reminder);
  }
}
