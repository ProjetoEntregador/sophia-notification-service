import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE } from '@/db/database.module';
import { medications } from './medication.schema';
import { treatments } from '@/treatments/adapters/out/treatment.schema';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { Medication } from '@/medications/domain/medication.entity';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';
import { treatmentsToMedications } from '@/treatments/adapters/out/treatment-medication-link.schema';
import { AuditPublisher } from '@/audit/domain/audit-publisher.port';

type MedicationRow = typeof medications.$inferSelect;

@Injectable()
export class DrizzleMedicationsRepository extends MedicationsRepository {
  constructor(
    @Inject(DATABASE) private readonly db: NodePgDatabase,
    private readonly audit: AuditPublisher,
  ) {
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

  async findByUserId(userId: string): Promise<Medication[]> {
    const rows = await this.db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId));
    return rows.map((r) => this.toEntity(r));
  }

  async findByIds(ids: string[]): Promise<Medication[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select()
      .from(medications)
      .where(inArray(medications.id, ids));
    return rows.map((r) => this.toEntity(r));
  }

  async findTreatmentsOf(medicationId: string): Promise<Treatment[]> {
    const rows = await this.db
      .select({
        id: treatments.id,
        userId: treatments.userId,
        intervalHours: treatments.intervalHours,
        startTime: treatments.startTime,
        endTime: treatments.endTime,
        cancelledAt: treatments.cancelledAt,
      })
      .from(treatments)
      .innerJoin(
        treatmentsToMedications,
        eq(treatmentsToMedications.treatmentId, treatments.id),
      )
      .where(
        and(
          eq(treatmentsToMedications.medicationId, medicationId),
          isNull(treatments.cancelledAt),
        ),
      );

    return rows.map(
      (r) =>
        new Treatment(
          r.id,
          r.userId,
          r.intervalHours,
          r.startTime,
          r.endTime,
          [medicationId],
          r.cancelledAt,
        ),
    );
  }

  async save(medication: Medication): Promise<Medication> {
    const previous = await this.findById(medication.id);
    const row = this.toRow(medication);
    await this.db
      .insert(medications)
      .values(row)
      .onConflictDoUpdate({ target: medications.id, set: row });

    await this.audit.record({
      entity: 'notification_medication',
      operation: previous ? 'UPDATE' : 'INSERT',
      oldData: previous,
      newData: medication,
      changedBy: medication.userId,
    });

    return medication;
  }

  async delete(id: string): Promise<boolean> {
    const previous = await this.findById(id);

    const deleted = await this.db.transaction(async (tx) => {
      await tx
        .delete(treatmentsToMedications)
        .where(eq(treatmentsToMedications.medicationId, id));

      const result = await tx
        .delete(medications)
        .where(eq(medications.id, id))
        .returning({ id: medications.id });
      return result.length > 0;
    });

    if (deleted && previous) {
      await this.audit.record({
        entity: 'notification_medication',
        operation: 'DELETE',
        oldData: previous,
        newData: null,
        changedBy: previous.userId,
      });
    }

    return deleted;
  }

  private toEntity(row: MedicationRow): Medication {
    return new Medication(row.id, row.userId, row.name, row.quantity);
  }

  private toRow(m: Medication) {
    return {
      id: m.id,
      userId: m.userId,
      name: m.name,
      quantity: m.quantity,
    };
  }
}
