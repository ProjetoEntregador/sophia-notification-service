import { Injectable, NotFoundException } from '@nestjs/common';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { MedicationStatus } from '@/medications/domain/medication-status';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';

@Injectable()
export class GetMedicationStatusUseCase {
  constructor(private readonly medications: MedicationsRepository) {}

  async execute(id: string, untilDate: Date): Promise<MedicationStatus> {
    const medication = await this.medications.findById(id);
    if (!medication) throw new NotFoundException(`Medication ${id} not found`);

    const treatments = await this.medications.findTreatmentsOf(id);
    const { totalConsumption, lastConsumptionDate } = this.computeConsumption(
      treatments,
      untilDate,
    );

    return {
      quantity: Math.max(medication.quantity - totalConsumption, 0),
      lastConsumptionDate,
    };
  }

  private computeConsumption(
    treatments: Treatment[],
    until: Date,
  ): { totalConsumption: number; lastConsumptionDate: Date | null } {
    const now = new Date();
    let totalConsumption = 0;
    let lastConsumptionDate: Date | null = null;

    for (const treatment of treatments) {
      const start = treatment.startTime;
      const end = treatment.endTime;

      const effectiveStart = start > now ? start : now;
      const effectiveEnd = end < until ? end : until;
      if (effectiveStart > effectiveEnd) continue;

      const intervalMs = treatment.intervalHours * 60 * 60 * 1000;
      const diff = effectiveStart.getTime() - start.getTime();
      const skippedIntervals = Math.ceil(diff / intervalMs);
      const firstOccurrence = start.getTime() + skippedIntervals * intervalMs;
      if (firstOccurrence > effectiveEnd.getTime()) continue;

      const occurrences =
        Math.floor((effectiveEnd.getTime() - firstOccurrence) / intervalMs) + 1;
      totalConsumption += occurrences;

      const lastOccurrenceTime =
        firstOccurrence + (occurrences - 1) * intervalMs;
      const lastOccurrenceDate = new Date(lastOccurrenceTime);
      if (!lastConsumptionDate || lastOccurrenceDate > lastConsumptionDate) {
        lastConsumptionDate = lastOccurrenceDate;
      }
    }

    return { totalConsumption, lastConsumptionDate };
  }
}
