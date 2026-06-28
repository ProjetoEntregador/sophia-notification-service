import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { RegenerateTreatmentRemindersUseCase } from './regenerate-treatment-reminders.usecase';

@Injectable()
export class UpdateTreatmentEndDateUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly regenerateReminders: RegenerateTreatmentRemindersUseCase,
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

    await this.regenerateReminders.execute(saved);
    return saved;
  }
}
