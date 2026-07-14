import { Injectable } from '@nestjs/common';
import { Clock } from '@/shared/ports/clock.port';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';
import { Reminder } from '@/reminders/domain/reminder.entity';
import {
  AdherenceReport,
  AdherenceReportLine,
} from '../dtos/adherence-report.type';
import { AdherenceBucket } from '../dtos/adherence-bucket.type';
import {
  AdherenceDateRange,
  AdherenceReportContext,
} from '../dtos/adherence-report-context.type';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const UNKNOWN_MEDICATION = 'desconhecido';

@Injectable()
export class GetAdherenceReportUseCase {
  constructor(
    private readonly reminders: RemindersRepository,
    private readonly treatments: TreatmentsRepository,
    private readonly medications: MedicationsRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, rangeDays: number): Promise<AdherenceReport> {
    const range = this.computeDateRange(rangeDays);
    const context = await this.loadContext(userId, range);
    const buckets = this.bucketByMedication(context);
    const lines = this.toReportLines(buckets);
    const overall = this.computeOverall(lines);

    return { rangeDays, from: range.from, until: range.until, lines, overall };
  }

  private computeDateRange(rangeDays: number): AdherenceDateRange {
    const until = this.clock.now();
    const from = new Date(until.getTime() - rangeDays * MS_PER_DAY);
    return { from, until };
  }

  private async loadContext(
    userId: string,
    range: AdherenceDateRange,
  ): Promise<AdherenceReportContext> {
    const [reminders, treatments] = await Promise.all([
      this.reminders.findUpcomingByUserId(userId, range.from, range.until),
      this.treatments.findByUserId(userId),
    ]);

    const treatmentToMedIds = new Map<string, string[]>(
      treatments.map((t) => [t.id, t.medicationIds]),
    );
    const allMedIds = Array.from(
      new Set(treatments.flatMap((t) => t.medicationIds)),
    );
    const meds = await this.medications.findByIds(allMedIds);
    const medNameById = new Map(meds.map((m) => [m.id, m.name]));

    return { reminders, treatmentToMedIds, medNameById };
  }

  private bucketByMedication(
    context: AdherenceReportContext,
  ): Map<string, AdherenceBucket> {
    const byMed = new Map<string, AdherenceBucket>();
    for (const reminder of context.reminders) {
      const names = this.medicationNamesFor(reminder, context);
      for (const name of names) {
        this.tally(byMed, name, reminder);
      }
    }
    return byMed;
  }

  private medicationNamesFor(
    reminder: Reminder,
    context: AdherenceReportContext,
  ): string[] {
    const medIds = context.treatmentToMedIds.get(reminder.treatmentId) ?? [];
    if (medIds.length === 0) return [UNKNOWN_MEDICATION];
    return medIds.map(
      (id) => context.medNameById.get(id) ?? UNKNOWN_MEDICATION,
    );
  }

  private tally(
    byMed: Map<string, AdherenceBucket>,
    name: string,
    reminder: Reminder,
  ): void {
    const bucket = this.ensureBucket(byMed, name);
    if (reminder.confirmed === true) bucket.confirmed += 1;
    else if (reminder.confirmed === false) bucket.skipped += 1;
    else bucket.pending += 1;
  }

  private ensureBucket(
    byMed: Map<string, AdherenceBucket>,
    name: string,
  ): AdherenceBucket {
    const existing = byMed.get(name);
    if (existing) return existing;
    const fresh: AdherenceBucket = { confirmed: 0, skipped: 0, pending: 0 };
    byMed.set(name, fresh);
    return fresh;
  }

  private toReportLines(
    byMed: Map<string, AdherenceBucket>,
  ): AdherenceReportLine[] {
    return Array.from(byMed.entries()).map(([medicationName, bucket]) =>
      this.toReportLine(medicationName, bucket),
    );
  }

  private toReportLine(
    medicationName: string,
    bucket: AdherenceBucket,
  ): AdherenceReportLine {
    const total = bucket.confirmed + bucket.skipped + bucket.pending;
    return {
      medicationName,
      confirmed: bucket.confirmed,
      skipped: bucket.skipped,
      pending: bucket.pending,
      total,
      adherenceRate: total === 0 ? 0 : bucket.confirmed / total,
    };
  }

  private computeOverall(
    lines: AdherenceReportLine[],
  ): AdherenceReport['overall'] {
    const acc = lines.reduce(
      (sum, line) => {
        sum.confirmed += line.confirmed;
        sum.skipped += line.skipped;
        sum.pending += line.pending;
        sum.total += line.total;
        return sum;
      },
      { confirmed: 0, skipped: 0, pending: 0, total: 0 },
    );
    return {
      ...acc,
      adherenceRate: acc.total === 0 ? 0 : acc.confirmed / acc.total,
    };
  }
}
