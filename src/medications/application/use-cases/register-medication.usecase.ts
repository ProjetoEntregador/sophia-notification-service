import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Medication } from '../../domain/medication.entity';
import { MedicationsRepository } from '../../domain/medications.repository.port';
import { CreateMedicationInput } from '../../../@types/medications';

@Injectable()
export class RegisterMedicationUseCase {
  constructor(private readonly medications: MedicationsRepository) {}

  async execute(input: CreateMedicationInput): Promise<Medication> {
    if (!input.name?.trim()) {
      throw new BadRequestException('Nome do medicamento é obrigatório');
    }
    if (input.quantity < 0) {
      throw new BadRequestException('Quantidade não pode ser negativa');
    }

    const medication = new Medication(
      randomUUID(),
      input.userId,
      input.jid,
      input.name.trim(),
      input.quantity,
    );
    return this.medications.save(medication);
  }
}
