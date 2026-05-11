import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, isNull, lt, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { reminders } from './reminder.schema';
import { DATABASE } from '@/db/database.module';
import { treatments } from '@/treatments/adapters/out/treatment.schema';
import { medications } from '@/medications/adapters/out/medication.schema';
import { users } from '@/users/adapters/out/user.schema';
import { Reminder } from '@/reminders/domain/reminder.entity';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { DueReminderProjection } from '@/reminders/domain/due-reminder.projection';
import { treatmentsToMedications } from '@/treatments/adapters/out/treatment-medication-link.schema';

type ReminderRow = typeof reminders.$inferSelect;

type DueRow = {
  reminderId: string;
  treatmentId: string;
  scheduledTime: Date;
  jid: string;
  medicationName: string;
};

type GroupedDue = {
  treatmentId: string;
  scheduledTime: Date;
  jid: string;
  medicationNames: string[];
};

@Injectable()
export class DrizzleRemindersRepository extends RemindersRepository {
  constructor(@Inject(DATABASE) private readonly db: NodePgDatabase) {
    super();
  }

  async findAll(): Promise<Reminder[]> {
    const rows = await this.db.select().from(reminders);
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Reminder | null> {
    const [row] = await this.db
      .select()
      .from(reminders)
      .where(eq(reminders.id, id));
    return row ? this.toEntity(row) : null;
  }

  async findInDay(day: Date): Promise<Reminder[]> {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    const rows = await this.db
      .select()
      .from(reminders)
      .where(
        and(
          lte(reminders.scheduledTime, end),
          gte(reminders.scheduledTime, start),
        ),
      );
    return rows.map((r) => this.toEntity(r));
  }

  async findInDateRange(start: Date, end: Date): Promise<Reminder[]> {
    const rows = await this.db
      .select()
      .from(reminders)
      .where(
        and(
          gte(reminders.scheduledTime, start),
          lte(reminders.scheduledTime, end),
          isNull(reminders.sentAt),
        ),
      )
      .orderBy(reminders.scheduledTime);
    return rows.map((r) => this.toEntity(r));
  }

  async findOldestUnresolved(userId?: string): Promise<Reminder | null> {
    const baseConditions = [
      eq(reminders.sent, true),
      isNull(reminders.confirmed),
    ];

    if (userId) {
      const rows = await this.db
        .select({
          id: reminders.id,
          treatmentId: reminders.treatmentId,
          scheduledTime: reminders.scheduledTime,
          sent: reminders.sent,
          sentAt: reminders.sentAt,
          confirmed: reminders.confirmed,
          confirmedAt: reminders.confirmedAt,
        })
        .from(reminders)
        .innerJoin(treatments, eq(treatments.id, reminders.treatmentId))
        .where(and(...baseConditions, eq(treatments.userId, userId)))
        .orderBy(asc(reminders.sentAt))
        .limit(1);
      return rows[0] ? this.toEntity(rows[0]) : null;
    }

    const [row] = await this.db
      .select()
      .from(reminders)
      .where(and(...baseConditions))
      .orderBy(asc(reminders.sentAt))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async findExpired(now: Date, graceMinutes: number): Promise<Reminder[]> {
    const cutoff = new Date(now.getTime() - graceMinutes * 60_000);
    const rows = await this.db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.sent, true),
          isNull(reminders.confirmed),
          lte(reminders.sentAt, cutoff),
        ),
      );
    return rows.map((r) => this.toEntity(r));
  }

  async findDue(now: Date): Promise<DueReminderProjection[]> {
    const rows: DueRow[] = await this.db
      .select({
        reminderId: reminders.id,
        treatmentId: reminders.treatmentId,
        scheduledTime: reminders.scheduledTime,
        jid: users.jid,
        medicationName: medications.name,
      })
      .from(reminders)
      .innerJoin(treatments, eq(treatments.id, reminders.treatmentId))
      .innerJoin(users, eq(users.id, treatments.userId))
      .innerJoin(
        treatmentsToMedications,
        eq(treatmentsToMedications.treatmentId, treatments.id),
      )
      .innerJoin(
        medications,
        eq(medications.id, treatmentsToMedications.medicationId),
      )
      .where(and(lte(reminders.scheduledTime, now), eq(reminders.sent, false)))
      .orderBy(asc(reminders.scheduledTime));

    const grouped = this.groupByReminder(rows);
    return Promise.all(
      Array.from(grouped.entries()).map(async ([reminderId, data]) => ({
        reminderId,
        treatmentId: data.treatmentId,
        scheduledTime: data.scheduledTime,
        jid: data.jid,
        medicationNames: data.medicationNames,
        previousSkipped: await this.wasPreviousSkipped(
          data.treatmentId,
          data.scheduledTime,
        ),
      })),
    );
  }

  async save(reminder: Reminder): Promise<Reminder> {
    const row = this.toRow(reminder);
    const [saved] = await this.db
      .insert(reminders)
      .values(row)
      .onConflictDoUpdate({ target: reminders.id, set: row })
      .returning();
    return this.toEntity(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(reminders)
      .where(eq(reminders.id, id))
      .returning({ id: reminders.id });
    return result.length > 0;
  }

  private async wasPreviousSkipped(
    treatmentId: string,
    scheduledTime: Date,
  ): Promise<boolean> {
    const [prev] = await this.db
      .select({ confirmed: reminders.confirmed })
      .from(reminders)
      .where(
        and(
          eq(reminders.treatmentId, treatmentId),
          lt(reminders.scheduledTime, scheduledTime),
        ),
      )
      .orderBy(desc(reminders.scheduledTime))
      .limit(1);
    return prev?.confirmed === false;
  }

  private groupByReminder(rows: DueRow[]): Map<string, GroupedDue> {
    const grouped = new Map<string, GroupedDue>();

    for (const r of rows) {
      const existing = grouped.get(r.reminderId);
      if (existing) {
        existing.medicationNames.push(r.medicationName);
      } else {
        grouped.set(r.reminderId, {
          treatmentId: r.treatmentId,
          scheduledTime: r.scheduledTime,
          jid: r.jid,
          medicationNames: [r.medicationName],
        });
      }
    }
    return grouped;
  }

  private toEntity(row: ReminderRow): Reminder {
    return new Reminder(
      row.id,
      row.treatmentId,
      row.scheduledTime,
      row.sent,
      row.sentAt,
      row.confirmed,
      row.confirmedAt,
    );
  }

  private toRow(r: Reminder) {
    return {
      id: r.id,
      treatmentId: r.treatmentId,
      scheduledTime: r.scheduledTime,
      sent: r.sent,
      sentAt: r.sentAt,
      confirmed: r.confirmed,
      confirmedAt: r.confirmedAt,
    };
  }
}
