import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateTreatmentInput } from '../dtos/treatment.input';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';

@Injectable()
export class UpdateTreatmentUseCase {
  constructor(private readonly treatments: TreatmentsRepository) {}

  async execute(id: string, input: UpdateTreatmentInput): Promise<Treatment> {
    const current = await this.treatments.findById(id);
    if (!current) throw new NotFoundException(`Treatment ${id} not found`);

    const merged = new Treatment(
      current.id,
      input.userId ?? current.userId,
      input.jid ?? current.jid,
      input.intervalHours ?? current.intervalHours,
      input.startTime ? new Date(input.startTime) : current.startTime,
      input.endTime ? new Date(input.endTime) : current.endTime,
      input.medicationsIds ?? current.medicationIds,
    );
    return this.treatments.save(merged);
  }
}
