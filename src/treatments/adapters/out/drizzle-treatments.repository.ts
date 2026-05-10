import { eq } from 'drizzle-orm';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE } from '@/db/database.module';
import { treatments } from './treatment.schema';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { treatmentsToMedications } from './treatment-medication-link.schema';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';

type TreatmentRow = typeof treatments.$inferSelect;

@Injectable()
export class DrizzleTreatmentsRepository extends TreatmentsRepository {
  constructor(@Inject(DATABASE) private readonly db: NodePgDatabase) {
    super();
  }

  async findAll(): Promise<Treatment[]> {
    const rows = await this.db.select().from(treatments);
    return Promise.all(rows.map((r) => this.toEntity(r)));
  }

  async findById(id: string): Promise<Treatment | null> {
    const [row] = await this.db
      .select()
      .from(treatments)
      .where(eq(treatments.id, id));
    return row ? this.toEntity(row) : null;
  }

  async save(treatment: Treatment): Promise<Treatment> {
    return this.db.transaction(async (tx) => {
      const row = this.toRow(treatment);

      await tx
        .insert(treatments)
        .values(row)
        .onConflictDoUpdate({ target: treatments.id, set: row });

      await tx
        .delete(treatmentsToMedications)
        .where(eq(treatmentsToMedications.treatmentId, treatment.id));

      if (treatment.medicationIds.length > 0) {
        await tx.insert(treatmentsToMedications).values(
          treatment.medicationIds.map((medicationId) => ({
            treatmentId: treatment.id,
            medicationId,
          })),
        );
      }

      return treatment;
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      await tx
        .delete(treatmentsToMedications)
        .where(eq(treatmentsToMedications.treatmentId, id));

      const result = await tx
        .delete(treatments)
        .where(eq(treatments.id, id))
        .returning({ id: treatments.id });
      return result.length > 0;
    });
  }

  private async toEntity(row: TreatmentRow): Promise<Treatment> {
    const links = await this.db
      .select({ medicationId: treatmentsToMedications.medicationId })
      .from(treatmentsToMedications)
      .where(eq(treatmentsToMedications.treatmentId, row.id));

    return new Treatment(
      row.id,
      row.userId,
      row.jid,
      row.intervalHours,
      row.startTime,
      row.endTime,
      links.map((l) => l.medicationId),
    );
  }

  private toRow(t: Treatment) {
    return {
      id: t.id,
      userId: t.userId,
      jid: t.jid,
      intervalHours: t.intervalHours,
      startTime: t.startTime,
      endTime: t.endTime,
    };
  }
}
