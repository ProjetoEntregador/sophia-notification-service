import { Injectable } from '@nestjs/common';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { TreatmentSummaryProjection } from '@/treatments/domain/treatment-summary.projection';

@Injectable()
export class ListUserTreatmentsUseCase {
  constructor(
    private readonly treatments: TreatmentsRepository,
    private readonly medications: MedicationsRepository,
    private readonly reminders: RemindersRepository,
  ) {}

  async execute(userId: string): Promise<TreatmentSummaryProjection[]> {
    const userTreatments = await this.treatments.findByUserId(userId);
    if (userTreatments.length === 0) return [];

    const allMedIds = Array.from(
      new Set(userTreatments.flatMap((t) => t.medicationIds)),
    );
    const meds = await this.medications.findByIds(allMedIds);
    const medById = new Map(meds.map((m) => [m.id, m]));

    return Promise.all(
      userTreatments.map(async (treatment) => {
        const treatmentReminders = await this.reminders.findByTreatmentId(
          treatment.id,
        );
        const totals = {
          sent: 0,
          confirmed: 0,
          skipped: 0,
          pending: 0,
        };
        for (const r of treatmentReminders) {
          if (r.sent) totals.sent++;
          if (r.confirmed === true) totals.confirmed++;
          else if (r.confirmed === false) totals.skipped++;
          else if (!r.sent) totals.pending++;
        }

        return {
          treatment,
          medicationNames: treatment.medicationIds
            .map((id) => medById.get(id)?.name)
            .filter((n): n is string => !!n),
          totals,
        };
      }),
    );
  }
}
