import { Injectable } from '@nestjs/common';
import { Medication } from '../../domain/medication.entity';
import { MedicationsRepository } from '../../domain/medications.repository.port';

@Injectable()
export class FindMedicationByNameUseCase {
  constructor(private readonly medications: MedicationsRepository) {}

  async execute(name: string, jid: string): Promise<Medication[]> {
    const userMeds = await this.medications.findByJid(jid);
    return userMeds.filter((m) => m.matches(name));
  }
}
