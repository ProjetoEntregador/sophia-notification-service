import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateTreatmentInput } from '../dtos/treatment.input';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { CreateInitialReminderUseCase } from '@/reminders/application/use-cases/create-initial-reminder.usecase';
import { Clock } from '@/shared/ports/clock.port';
import { TransactionRunner } from '@/shared/ports/transaction-runner.port';

const PAST_TOLERANCE_MS = 5 * 60 * 1000;

@Injectable()
export class RegisterTreatmentUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly createInitialReminder: CreateInitialReminderUseCase,
    private readonly clock: Clock,
    private readonly transactionRunner: TransactionRunner,
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

    const now = this.clock.now();
    if (start.getTime() < now.getTime() - PAST_TOLERANCE_MS) {
      throw new BadRequestException(
        'startTime não pode estar no passado. Informe um horário a partir de agora.',
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
      input.intervalHours,
      start,
      end,
      input.medicationsIds,
    );

    return this.transactionRunner.run(async (tx) => {
      const saved = await this.treatments.save(treatment, tx);
      await this.createInitialReminder.execute(saved.id, saved.startTime, tx);
      return saved;
    });
  }
}
