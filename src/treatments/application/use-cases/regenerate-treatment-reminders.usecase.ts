import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { Reminder } from '@/reminders/domain/reminder.entity';

@Injectable()
export class RegenerateTreatmentRemindersUseCase {
  constructor(private readonly reminders: RemindersRepository) {}

  async execute(treatment: Treatment): Promise<void> {
    await this.reminders.deleteFutureUnsentByTreatmentId(treatment.id);

    const all = await this.reminders.findByTreatmentId(treatment.id);
    const lastSent = all
      .filter((r) => r.sent)
      .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime())[0];

    let next = lastSent
      ? treatment.nextDoseAfter(lastSent.confirmedAt ?? lastSent.scheduledTime)
      : treatment.startTime;

    while (next <= treatment.endTime) {
      await this.reminders.save(
        new Reminder(randomUUID(), treatment.id, next, false, null, null, null),
      );
      next = treatment.nextDoseAfter(next);
    }
  }
}
