import { Injectable, NotFoundException } from '@nestjs/common';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';

@Injectable()
export class ListTreatmentsUseCase {
  constructor(private readonly treatments: TreatmentsRepository) {}

  findAll(): Promise<Treatment[]> {
    return this.treatments.findAll();
  }

  async findOne(id: string): Promise<Treatment> {
    const treatment = await this.treatments.findById(id);
    if (!treatment) throw new NotFoundException(`Treatment ${id} not found`);
    return treatment;
  }
}
