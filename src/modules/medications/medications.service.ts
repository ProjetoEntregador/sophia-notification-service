import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database.module';
import {
  CreateMedicationInput,
  Medication,
  MedicationStatus,
  NewMedication,
  UpdateMedicationInput,
} from 'src/@types/medications';
import { medications } from 'src/db/schema/medications';
import { treatments } from 'src/db/schema';
import { treatmentsToMedications } from 'src/db/schema/treatmentsToMedications';

@Injectable()
export class MedicationsService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}

  findAll(): Promise<Medication[]> {
    return this.db.select().from(medications);
  }

  async findOne(id: string): Promise<Medication> {
    const [row] = await this.db
      .select()
      .from(medications)
      .where(eq(medications.id, id));
    if (!row) throw new NotFoundException(`Medication ${id} not found`);
    return row;
  }

  async create(input: CreateMedicationInput): Promise<Medication> {
    const [row] = await this.db
      .insert(medications)
      .values(this.toValues(input) as NewMedication)
      .returning();
    return row;
  }

  async update(id: string, input: UpdateMedicationInput): Promise<Medication> {
    const [row] = await this.db
      .update(medications)
      .set(this.toValues(input))
      .where(eq(medications.id, id))
      .returning();
    if (!row) throw new NotFoundException(`Medication ${id} not found`);
    return row;
  }

  async remove(id: string): Promise<void> {
    const result = await this.db
      .delete(medications)
      .where(eq(medications.id, id))
      .returning({ id: medications.id });
    if (result.length === 0) {
      throw new NotFoundException(`Medication ${id} not found`);
    }
  }

  async getMedicationUntilDate(
    id: string,
    date: Date,
  ): Promise<MedicationStatus> {
    const rows = await this.db
      .select({
        medication: medications,
        treatment: treatments,
      })
      .from(medications)
      .leftJoin(
        treatmentsToMedications,
        eq(medications.id, treatmentsToMedications.medicationId),
      )
      .leftJoin(
        treatments,
        eq(treatments.id, treatmentsToMedications.treatmentId),
      )
      .where(eq(medications.id, id));

    if (!rows.length || !rows[0].medication) {
      throw new Error('Medication not found');
    }

    const medication = rows[0].medication;

    const treatmentsList = rows
      .map((r) => r.treatment)
      .filter((t) => t !== null);

    const now = new Date();
    let totalConsumption = 0;
    let lastConsumptionDate: Date | null = null;

    for (const treatment of treatmentsList) {
      const start = new Date(treatment.startTime);
      const end = new Date(treatment.endTime);

      const effectiveStart = start > now ? start : now;
      const effectiveEnd = end < date ? end : date;

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

    const remaining = medication.quantity - totalConsumption;

    return {
      quantity: Math.max(remaining, 0),
      lastConsumptionDate,
    };
  }

  private toValues(
    input: Partial<CreateMedicationInput>,
  ): Partial<NewMedication> {
    return {
      id: input.id,
      jid: input.jid,
      name: input.name,
      quantity: input.quantity,
      userId: input.userId,
    };
  }
}
