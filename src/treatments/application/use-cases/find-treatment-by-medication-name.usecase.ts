import { Injectable } from '@nestjs/common';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';
import { Treatment } from '@/treatments/domain/treatment.entity';

@Injectable()
export class FindTreatmentByMedicationNameUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly medications: MedicationsRepository,
  ) {}

  async execute(userId: string, medicationName: string): Promise<Treatment[]> {
    const userMeds = await this.medications.findByUserId(userId);
    const matchingMeds = userMeds.filter((m) => m.matches(medicationName));
    if (matchingMeds.length === 0) return [];

    const userTreatments = await this.treatments.findByUserId(userId);
    const matchingMedIds = new Set(matchingMeds.map((m) => m.id));
    return userTreatments.filter((t) =>
      t.medicationIds.some((id) => matchingMedIds.has(id)),
    );
  }
}
