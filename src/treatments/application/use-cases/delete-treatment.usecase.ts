import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentsRepository } from '../../domain/treatment.repository.port';

@Injectable()
export class DeleteTreatmentUseCase {
  constructor(private readonly treatments: TreatmentsRepository) {}

  async execute(id: string): Promise<void> {
    const removed = await this.treatments.delete(id);
    if (!removed) throw new NotFoundException(`Treatment ${id} not found`);
  }
}
