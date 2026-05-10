import { Injectable, NotFoundException } from '@nestjs/common';
import { Medication } from '../../domain/medication.entity';
import { MedicationsRepository } from '../../domain/medications.repository.port';
import { UpdateMedicationInput } from '../../../@types/medications';

@Injectable()
export class UpdateMedicationUseCase {
  constructor(private readonly medications: MedicationsRepository) {}

  async execute(id: string, input: UpdateMedicationInput): Promise<Medication> {
    const current = await this.medications.findById(id);
    if (!current) throw new NotFoundException(`Medication ${id} not found`);

    const merged = new Medication(
      current.id,
      input.userId ?? current.userId,
      input.jid ?? current.jid,
      input.name?.trim() ?? current.name,
      input.quantity ?? current.quantity,
    );
    return this.medications.save(merged);
  }
}
