import { Injectable, NotFoundException } from '@nestjs/common';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';

@Injectable()
export class DeleteMedicationUseCase {
  constructor(private readonly medications: MedicationsRepository) {}

  async execute(id: string): Promise<void> {
    const removed = await this.medications.delete(id);
    if (!removed) throw new NotFoundException(`Medication ${id} not found`);
  }
}
