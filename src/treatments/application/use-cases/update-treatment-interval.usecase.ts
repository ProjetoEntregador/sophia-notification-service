import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { RegenerateTreatmentRemindersUseCase } from './regenerate-treatment-reminders.usecase';

@Injectable()
export class UpdateTreatmentIntervalUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly regenerateReminders: RegenerateTreatmentRemindersUseCase,
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

    await this.regenerateReminders.execute(saved);
    return saved;
  }
}
