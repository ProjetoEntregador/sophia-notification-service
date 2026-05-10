import { Injectable, NotFoundException } from '@nestjs/common';
import { Medication } from '../../domain/medication.entity';
import { MedicationsRepository } from '../../domain/medications.repository.port';

@Injectable()
export class ListMedicationsUseCase {
  constructor(private readonly medications: MedicationsRepository) {}

  async findAll(): Promise<Medication[]> {
    return await this.medications.findAll();
  }

  async findOne(id: string): Promise<Medication> {
    const medication = await this.medications.findById(id);
    if (!medication) throw new NotFoundException(`Medication ${id} not found`);
    return medication;
  }
}
