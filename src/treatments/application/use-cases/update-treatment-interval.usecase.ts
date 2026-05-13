import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { Reminder } from '@/reminders/domain/reminder.entity';

@Injectable()
export class UpdateTreatmentIntervalUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly reminders: RemindersRepository,
  ) {}

  async execute(
    treatmentId: string,
    newIntervalHours: number,
  ): Promise<Treatment> {
    if (
      !Number.isInteger(newIntervalHours) ||
      newIntervalHours < 1 ||
      newIntervalHours > 24
    ) {
      throw new BadRequestException('intervalHours deve estar entre 1 e 24');
    }

    const current = await this.treatments.findById(treatmentId);
    if (!current) throw new NotFoundException(`Treatment ${treatmentId}`);

    const updated = new Treatment(
      current.id,
      current.userId,
      newIntervalHours,
      current.startTime,
      current.endTime,
      current.medicationIds,
    );
    const saved = await this.treatments.save(updated);

    await this.regeneratePendingReminders(saved);
    return saved;
  }

  private async regeneratePendingReminders(
    treatment: Treatment,
  ): Promise<void> {
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
