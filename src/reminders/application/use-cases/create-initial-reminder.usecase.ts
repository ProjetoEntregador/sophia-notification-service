import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Reminder } from '@/reminders/domain/reminder.entity';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { TransactionExecutor } from '@/shared/ports/transaction-runner.port';

@Injectable()
export class CreateInitialReminderUseCase {
  constructor(private readonly reminders: RemindersRepository) {}

  async execute(
    treatmentId: string,
    scheduledTime: Date,
    tx?: TransactionExecutor,
  ): Promise<Reminder> {
    const reminder = new Reminder(
      randomUUID(),
      treatmentId,
      scheduledTime,
      false,
      null,
      null,
      null,
    );
    return this.reminders.save(reminder, tx);
  }
}
