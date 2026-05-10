import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../../database.module';
import { medications } from './medication.schema';
import { treatments } from '../../../db/schema/treatments';
import { treatmentsToMedications } from '../../../treatments/adapters/out/treatment-medication-link.schema';
import { Medication } from '../../domain/medication.entity';
import { MedicationsRepository } from '../../domain/medications.repository.port';
import { Treatment } from '../../../treatments/domain/treatment.entity';

type MedicationRow = typeof medications.$inferSelect;
type TreatmentRow = typeof treatments.$inferSelect;

@Injectable()
export class DrizzleMedicationsRepository extends MedicationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {
    super();
  }

  async findAll(): Promise<Medication[]> {
    const rows = await this.db.select().from(medications);
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Medication | null> {
    const [row] = await this.db
      .select()
      .from(medications)
      .where(eq(medications.id, id));
    return row ? this.toEntity(row) : null;
  }

  async findByJid(jid: string): Promise<Medication[]> {
    const rows = await this.db
      .select()
      .from(medications)
      .where(eq(medications.jid, jid));
    return rows.map((r) => this.toEntity(r));
  }

  async findTreatmentsOf(medicationId: string): Promise<Treatment[]> {
    const rows: TreatmentRow[] = await this.db
      .select({
        id: treatments.id,
        userId: treatments.userId,
        jid: treatments.jid,
        intervalHours: treatments.intervalHours,
        startTime: treatments.startTime,
        endTime: treatments.endTime,
      })
      .from(treatments)
      .innerJoin(
        treatmentsToMedications,
        eq(treatmentsToMedications.treatmentId, treatments.id),
      )
      .where(eq(treatmentsToMedications.medicationId, medicationId));

    return rows.map(
      (r) =>
        new Treatment(
          r.id,
          r.userId,
          r.jid,
          r.intervalHours,
          r.startTime,
          r.endTime,
          [medicationId],
        ),
    );
  }

  async save(medication: Medication): Promise<Medication> {
    const row = this.toRow(medication);
    await this.db
      .insert(medications)
      .values(row)
      .onConflictDoUpdate({ target: medications.id, set: row });
    return medication;
  }

  async delete(id: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      await tx
        .delete(treatmentsToMedications)
        .where(eq(treatmentsToMedications.medicationId, id));

      const result = await tx
        .delete(medications)
        .where(eq(medications.id, id))
        .returning({ id: medications.id });
      return result.length > 0;
    });
  }

  private toEntity(row: MedicationRow): Medication {
    return new Medication(row.id, row.userId, row.jid, row.name, row.quantity);
  }

  private toRow(m: Medication) {
    return {
      id: m.id,
      userId: m.userId,
      jid: m.jid,
      name: m.name,
      quantity: m.quantity,
    };
  }
}
