import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';

@Injectable()
export class CancelTreatmentUseCase {
  constructor(private readonly treatments: TreatmentsRepository) {}

  async execute(treatmentId: string): Promise<void> {
    const removed = await this.treatments.delete(treatmentId);
    if (!removed) throw new NotFoundException(`Treatment ${treatmentId}`);
    // Reminders são removidos via ON DELETE CASCADE.
    // O link table é tratado dentro do DrizzleTreatmentsRepository.delete.
  }
}
