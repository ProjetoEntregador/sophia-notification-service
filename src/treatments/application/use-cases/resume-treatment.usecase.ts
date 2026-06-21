import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';

@Injectable()
export class ResumeTreatmentUseCase {
  constructor(private readonly treatments: TreatmentsRepository) {}

  async execute(treatmentId: string): Promise<void> {
    const resumed = await this.treatments.resume(treatmentId);
    if (!resumed) {
      throw new NotFoundException(
        `Tratamento ${treatmentId} não encontrado ou foi cancelado.`,
      );
    }
  }
}
