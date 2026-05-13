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
export class UpdateTreatmentEndDateUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly reminders: RemindersRepository,
  ) {}

  async execute(treatmentId: string, newEndIso: string): Promise<Treatment> {
    const newEnd = new Date(newEndIso);
    if (Number.isNaN(newEnd.getTime())) {
      throw new BadRequestException('endTime inválido (ISO 8601)');
    }

    const current = await this.treatments.findById(treatmentId);
    if (!current) throw new NotFoundException(`Treatment ${treatmentId}`);

    if (newEnd <= current.startTime) {
      throw new BadRequestException('endTime precisa ser depois do startTime');
    }

    const updated = new Treatment(
      current.id,
      current.userId,
      current.intervalHours,
      current.startTime,
      newEnd,
      current.medicationIds,
    );
    const saved = await this.treatments.save(updated);

    // Apaga pendentes e regenera respeitando o novo endTime.
    await this.reminders.deleteFutureUnsentByTreatmentId(saved.id);

    const all = await this.reminders.findByTreatmentId(saved.id);
    const lastSent = all
      .filter((r) => r.sent)
      .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime())[0];

    let next = lastSent
      ? saved.nextDoseAfter(lastSent.confirmedAt ?? lastSent.scheduledTime)
      : saved.startTime;

    while (next <= saved.endTime) {
      await this.reminders.save(
        new Reminder(randomUUID(), saved.id, next, false, null, null, null),
      );
      next = saved.nextDoseAfter(next);
    }
    return saved;
  }
}
