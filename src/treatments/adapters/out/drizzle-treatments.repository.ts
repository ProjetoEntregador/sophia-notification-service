import { and, eq, isNull } from 'drizzle-orm';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE } from '@/db/database.module';
import { treatments } from './treatment.schema';
import { Treatment } from '@/treatments/domain/treatment.entity';
import { treatmentsToMedications } from './treatment-medication-link.schema';
import { TreatmentsRepository } from '@/treatments/domain/treatment.repository.port';
import { TransactionExecutor } from '@/shared/ports/transaction-runner.port';
import { AuditPublisher } from '@/audit/domain/audit-publisher.port';

type DrizzleExecutor = NodePgDatabase;

type TreatmentRow = typeof treatments.$inferSelect;

@Injectable()
export class DrizzleTreatmentsRepository extends TreatmentsRepository {
  constructor(
    @Inject(DATABASE) private readonly db: NodePgDatabase,
    private readonly audit: AuditPublisher,
  ) {
    super();
  }

  async findAll(): Promise<Treatment[]> {
    const rows = await this.db
      .select()
      .from(treatments)
      .where(isNull(treatments.cancelledAt));
    return Promise.all(rows.map((r) => this.toEntity(r)));
  }

  async findById(id: string): Promise<Treatment | null> {
    const [row] = await this.db
      .select()
      .from(treatments)
      .where(and(eq(treatments.id, id), isNull(treatments.cancelledAt)));
    return row ? this.toEntity(row) : null;
  }

  async findByUserId(userId: string): Promise<Treatment[]> {
    const rows = await this.db
      .select()
      .from(treatments)
      .where(
        and(eq(treatments.userId, userId), isNull(treatments.cancelledAt)),
      );
    return Promise.all(rows.map((r) => this.toEntity(r)));
  }

  async save(
    treatment: Treatment,
    tx?: TransactionExecutor,
  ): Promise<Treatment> {
    const previous = await this.findById(treatment.id);

    const action = async (executor: DrizzleExecutor): Promise<Treatment> => {
      const row = this.toRow(treatment);

      await executor
        .insert(treatments)
        .values(row)
        .onConflictDoUpdate({ target: treatments.id, set: row });

      await executor
        .delete(treatmentsToMedications)
        .where(eq(treatmentsToMedications.treatmentId, treatment.id));

      if (treatment.medicationIds.length > 0) {
        await executor.insert(treatmentsToMedications).values(
          treatment.medicationIds.map((medicationId) => ({
            treatmentId: treatment.id,
            medicationId,
          })),
        );
      }

      return treatment;
    };

    const saved = tx
      ? await action(tx as DrizzleExecutor)
      : await this.db.transaction(action);

    await this.audit.record({
      entity: 'treatment',
      operation: previous ? 'UPDATE' : 'INSERT',
      oldData: previous,
      newData: saved,
      changedBy: saved.userId,
    });

    return saved;
  }

  async cancel(id: string, at: Date): Promise<boolean> {
    const previous = await this.findById(id);
    const result = await this.db
      .update(treatments)
      .set({ cancelledAt: at })
      .where(and(eq(treatments.id, id), isNull(treatments.cancelledAt)))
      .returning({ id: treatments.id });
    const changed = result.length > 0;

    if (changed && previous) {
      await this.audit.record({
        entity: 'treatment',
        operation: 'UPDATE',
        oldData: previous,
        newData: previous.withCancellation(at),
        changedBy: previous.userId,
      });
    }

    return changed;
  }

  async pause(id: string, at: Date): Promise<boolean> {
    const previous = await this.findById(id);
    const result = await this.db
      .update(treatments)
      .set({ pausedAt: at })
      .where(
        and(
          eq(treatments.id, id),
          isNull(treatments.cancelledAt),
          isNull(treatments.pausedAt),
        ),
      )
      .returning({ id: treatments.id });
    const changed = result.length > 0;

    if (changed && previous) {
      await this.audit.record({
        entity: 'treatment',
        operation: 'UPDATE',
        oldData: previous,
        newData: previous.withPause(at),
        changedBy: previous.userId,
      });
    }

    return changed;
  }

  async resume(id: string): Promise<boolean> {
    const previous = await this.findById(id);
    const result = await this.db
      .update(treatments)
      .set({ pausedAt: null })
      .where(and(eq(treatments.id, id), isNull(treatments.cancelledAt)))
      .returning({ id: treatments.id });
    const changed = result.length > 0;

    if (changed && previous) {
      await this.audit.record({
        entity: 'treatment',
        operation: 'UPDATE',
        oldData: previous,
        newData: previous.withResume(),
        changedBy: previous.userId,
      });
    }

    return changed;
  }

  async delete(id: string): Promise<boolean> {
    const previous = await this.findById(id);

    const deleted = await this.db.transaction(async (tx) => {
      await tx
        .delete(treatmentsToMedications)
        .where(eq(treatmentsToMedications.treatmentId, id));

      const result = await tx
        .delete(treatments)
        .where(eq(treatments.id, id))
        .returning({ id: treatments.id });
      return result.length > 0;
    });

    if (deleted && previous) {
      await this.audit.record({
        entity: 'treatment',
        operation: 'DELETE',
        oldData: previous,
        newData: null,
        changedBy: previous.userId,
      });
    }

    return deleted;
  }

  private async toEntity(row: TreatmentRow): Promise<Treatment> {
    const links = await this.db
      .select({ medicationId: treatmentsToMedications.medicationId })
      .from(treatmentsToMedications)
      .where(eq(treatmentsToMedications.treatmentId, row.id));

    return new Treatment(
      row.id,
      row.userId,
      row.intervalHours,
      row.startTime,
      row.endTime,
      links.map((l) => l.medicationId),
      row.cancelledAt,
      row.pausedAt,
    );
  }

  private toRow(t: Treatment) {
    return {
      id: t.id,
      userId: t.userId,
      intervalHours: t.intervalHours,
      startTime: t.startTime,
      endTime: t.endTime,
      cancelledAt: t.cancelledAt,
      pausedAt: t.pausedAt,
    };
  }
}
