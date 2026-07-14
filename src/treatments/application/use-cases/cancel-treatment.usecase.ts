import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { Clock } from '@/shared/ports/clock.port';

@Injectable()
export class CancelTreatmentUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly reminders: RemindersRepository,
    private readonly clock: Clock,
  ) {}

  async execute(treatmentId: string): Promise<void> {
    const cancelled = await this.treatments.cancel(
      treatmentId,
      this.clock.now(),
    );
    if (!cancelled) {
      throw new NotFoundException(`Treatment ${treatmentId}`);
    }
    await this.reminders.deleteFutureUnsentByTreatmentId(treatmentId);
  }
}
