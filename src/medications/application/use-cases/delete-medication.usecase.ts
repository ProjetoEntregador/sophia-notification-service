import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';

@Injectable()
export class DeleteMedicationUseCase {
  constructor(private readonly medications: MedicationsRepository) {}

  async execute(id: string): Promise<void> {
    const activeTreatments = await this.medications.findTreatmentsOf(id);
    if (activeTreatments.length > 0) {
      throw new ConflictException(
        `Há ${activeTreatments.length} tratamento(s) ativo(s) usando este medicamento. Cancele o(s) tratamento(s) primeiro com cancel_treatment.`,
      );
    }

    const removed = await this.medications.delete(id);
    if (!removed) throw new NotFoundException(`Medication ${id} not found`);
  }
}
