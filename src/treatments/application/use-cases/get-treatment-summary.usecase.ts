import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { TreatmentSummaryProjection } from '@/treatments/domain/treatment-summary.projection';

@Injectable()
export class GetTreatmentSummaryUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly medications: MedicationsRepository,
    private readonly reminders: RemindersRepository,
  ) {}

  async execute(treatmentId: string): Promise<TreatmentSummaryProjection> {
    const treatment = await this.treatments.findById(treatmentId);
    if (!treatment) throw new NotFoundException(`Treatment ${treatmentId}`);

    const meds = await this.medications.findByIds(treatment.medicationIds);
    const treatmentReminders = await this.reminders.findByTreatmentId(
      treatment.id,
    );

    const totals = { sent: 0, confirmed: 0, skipped: 0, pending: 0 };
    for (const r of treatmentReminders) {
      if (r.sent) totals.sent++;
      if (r.confirmed === true) totals.confirmed++;
      else if (r.confirmed === false) totals.skipped++;
      else if (!r.sent) totals.pending++;
    }

    return {
      treatment,
      medicationNames: meds.map((m) => m.name),
      totals,
    };
  }
}
