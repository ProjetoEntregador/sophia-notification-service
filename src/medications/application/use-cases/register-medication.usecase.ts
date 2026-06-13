import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Medication } from '@/medications/domain/medication.entity';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';
import { CreateMedicationInput } from '../dtos/medication.input';

@Injectable()
export class RegisterMedicationUseCase {
  constructor(private readonly medications: MedicationsRepository) {}

  async execute(input: CreateMedicationInput): Promise<Medication> {
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException('Nome do medicamento é obrigatório');
    }
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new BadRequestException(
        'Quantidade precisa ser um inteiro maior ou igual a 1',
      );
    }

    const existing = await this.medications.findByUserId(input.userId);
    const duplicate = existing.find((m) => m.matches(name));
    if (duplicate) {
      throw new ConflictException(
        `Você já tem "${duplicate.name}" cadastrado. Use update_medication_quantity para alterar a quantidade.`,
      );
    }

    const medication = new Medication(
      randomUUID(),
      input.userId,
      name,
      input.quantity,
    );
    return this.medications.save(medication);
  }
}
