import { Injectable } from '@nestjs/common';
import { Medication } from '@/medications/domain/medication.entity';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';

@Injectable()
export class FindMedicationByNameUseCase {
  constructor(private readonly medications: MedicationsRepository) {}

  async execute(name: string, userId: string): Promise<Medication[]> {
    const userMeds = await this.medications.findByUserId(userId);
    return userMeds.filter((m) => m.matches(name));
  }
}
