import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Reminder } from '@/reminders/domain/reminder.entity';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';

@Injectable()
export class CreateNextReminderUseCase {
  private readonly logger = new Logger(CreateNextReminderUseCase.name);

  constructor(
    private readonly reminders: RemindersRepository,
    private readonly treatments: TreatmentsRepository,
  ) {}

  async execute(currentReminder: Reminder): Promise<Reminder | null> {
    if (!currentReminder.confirmedAt) return null;

    const treatment = await this.treatments.findById(
      currentReminder.treatmentId,
    );
    if (!treatment) {
      this.logger.debug(
        `Reminder ${currentReminder.id} aponta para tratamento ${currentReminder.treatmentId} cancelado ou inexistente — ignorando geração de próximo lembrete.`,
      );
      return null;
    }

    const nextScheduledTime = treatment.nextDoseAfter(
      currentReminder.confirmedAt,
    );

    if (nextScheduledTime > treatment.endTime) {
      const delay = nextScheduledTime.getTime() - treatment.endTime.getTime();
      await this.treatments.save(treatment.withExtendedEndBy(delay));
    }

    const next = new Reminder(
      randomUUID(),
      treatment.id,
      nextScheduledTime,
      false,
      null,
      null,
      null,
    );
    return this.reminders.save(next);
  }
}
