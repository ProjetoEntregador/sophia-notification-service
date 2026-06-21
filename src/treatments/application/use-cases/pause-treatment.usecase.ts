import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { Clock } from '@/shared/ports/clock.port';

@Injectable()
export class PauseTreatmentUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly clock: Clock,
  ) {}

  async execute(treatmentId: string): Promise<void> {
    const paused = await this.treatments.pause(treatmentId, this.clock.now());
    if (!paused) {
      throw new NotFoundException(
        `Tratamento ${treatmentId} não encontrado, já está pausado ou foi cancelado.`,
      );
    }
  }
}
