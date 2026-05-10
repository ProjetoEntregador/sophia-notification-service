import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateTreatmentInput } from '../dtos/treatment.input';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { CreateInitialReminderUseCase } from '@/reminders/application/use-cases/create-initial-reminder.usecase';

@Injectable()
export class RegisterTreatmentUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly createInitialReminder: CreateInitialReminderUseCase,
  ) {}

  async execute(input: CreateTreatmentInput): Promise<Treatment> {
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('startTime / endTime inválidos');
    }

    if (end <= start) {
      throw new BadRequestException(
        'endTime precisa ser posterior a startTime',
      );
    }

    if (input.intervalHours < 1 || input.intervalHours > 24) {
      throw new BadRequestException('intervalHours deve estar entre 1 e 24');
    }

    if (!input.medicationsIds || input.medicationsIds.length === 0) {
      throw new BadRequestException(
        'Tratamento exige pelo menos um medicamento',
      );
    }

    const treatment = new Treatment(
      randomUUID(),
      input.userId,
      input.jid,
      input.intervalHours,
      start,
      end,
      input.medicationsIds,
    );

    const saved = await this.treatments.save(treatment);
    await this.createInitialReminder.execute(saved.id, saved.startTime);
    return saved;
  }
}
