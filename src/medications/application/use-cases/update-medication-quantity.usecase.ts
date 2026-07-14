import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Medication } from '@/medications/domain/medication.entity';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';

@Injectable()
export class UpdateMedicationQuantityUseCase {
  constructor(private readonly medications: MedicationsRepository) {}

  async execute(
    userId: string,
    medicationName: string,
    quantity: number,
  ): Promise<Medication> {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new BadRequestException('quantity deve ser inteiro não negativo');
    }

    const userMeds = await this.medications.findByUserId(userId);
    const matches = userMeds.filter((m) => m.matches(medicationName));
    if (matches.length === 0) {
      throw new NotFoundException(
        `Medicamento "${medicationName}" não cadastrado`,
      );
    }
    if (matches.length > 1) {
      throw new BadRequestException(
        `Mais de um medicamento corresponde a "${medicationName}". Seja mais específico.`,
      );
    }
    return this.medications.save(matches[0].withQuantity(quantity));
  }
}
