import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  ExtractTablesWithRelations,
  gte,
  isNull,
  lt,
  lte,
  not,
} from 'drizzle-orm';
import {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database.module';
import { reminders } from '../../db/schema/reminders';
import { treatments } from '../../db/schema/treatments';
import { medications } from '../../db/schema/medications';
import { treatmentsToMedications } from '../../db/schema/treatmentsToMedications';
import {
  CreateReminderInput,
  DueReminder,
  DueReminderRow,
  GroupedDueReminderInterface,
  NewReminder,
  Reminder,
  UpdateReminderInput,
} from '../../@types';
import { toDate } from '../../utils/functions';
import { PgTransaction } from 'drizzle-orm/pg-core';

@Injectable()
export class RemindersService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}

  findAll(): Promise<Reminder[]> {
    return this.db.select().from(reminders);
  }

  async findOne(id: string): Promise<Reminder> {
    const [row] = await this.db
      .select()
      .from(reminders)
      .where(eq(reminders.id, id));
    if (!row) throw new NotFoundException(`Reminder ${id} not found`);
    return row;
  }

  async create(input: CreateReminderInput): Promise<Reminder> {
    const [row] = await this.db
      .insert(reminders)
      .values(this.toValues(input) as NewReminder)
      .returning();
    return row;
  }

  async update(id: string, input: UpdateReminderInput): Promise<Reminder> {
    const [row] = await this.db
      .update(reminders)
      .set(this.toValues(input))
      .where(eq(reminders.id, id))
      .returning();
    if (!row) throw new NotFoundException(`Reminder ${id} not found`);
    return row;
  }

  async remove(id: string): Promise<void> {
    const result = await this.db
      .delete(reminders)
      .where(eq(reminders.id, id))
      .returning({ id: reminders.id });
    if (result.length === 0) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }
  }

  async delay(id: string, delay: number): Promise<void> {
    const [reminder] = await this.db
      .update(reminders)
      .set({
        scheduledTime: new Date(
          reminders.scheduledTime._.data.getTime() + delay,
        ),
      })
      .where(eq(reminders.id, id))
      .returning();

    await this.delayTreatment(reminder.treatmentId, delay);
  }

  async confirmReminder(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [reminder] = await tx
        .select()
        .from(reminders)
        .where(and(eq(reminders.id, id), not(eq(reminders.confirmed, true))));

      if (!reminder) {
        throw new NotFoundException('No such reminder found.');
      }

      let reminderData = {};
      if (reminder.confirmed == false) {
        reminderData = { confirmedAt: new Date() };
      } else {
        reminderData = { confirmed: true, confirmedAt: new Date() };
      }

      const [newReminder] = await tx
        .update(reminders)
        .set(reminderData)
        .where(eq(reminders.id, id))
        .returning();

      await this.createNextTreatmentReminder(newReminder, tx);
    });
  }

  async skipReminder(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [reminder] = await tx
        .update(reminders)
        .set({ confirmed: false, confirmedAt: new Date() })
        .where(and(eq(reminders.id, id), isNull(reminders.confirmed)))
        .returning();

      if (!reminder) {
        throw new NotFoundException('No such reminder found.');
      }

      await this.createNextTreatmentReminder(reminder, tx);
    });
  }

  async getRemindersInBetweenDates(
    startDate: Date,
    endDate: Date,
  ): Promise<Reminder[]> {
    return await this.db
      .select()
      .from(reminders)
      .where(
        and(
          gte(reminders.scheduledTime, startDate),
          lte(reminders.scheduledTime, endDate),
          isNull(reminders.sentAt),
        ),
      )
      .orderBy(reminders.scheduledTime);
  }

  async confirmDose(jid: string): Promise<Reminder | null> {
    return this.resolvePending(jid, true);
  }

  async skipDose(jid: string): Promise<Reminder | null> {
    return this.resolvePending(jid, false);
  }

  async createInitialReminder(
    treatmentId: string,
    scheduledTime: Date,
  ): Promise<Reminder> {
    const [row] = await this.db
      .insert(reminders)
      .values({
        treatmentId,
        scheduledTime,
        sent: false,
        sentAt: null,
        confirmed: null,
        confirmedAt: null,
      })
      .returning();
    return row;
  }

  async findDueReminders(now: Date = new Date()): Promise<DueReminder[]> {
    const rows = await this.db
      .select({
        reminderId: reminders.id,
        treatmentId: reminders.treatmentId,
        scheduledTime: reminders.scheduledTime,
        jid: treatments.jid,
        medicationName: medications.name,
      })
      .from(reminders)
      .innerJoin(treatments, eq(treatments.id, reminders.treatmentId))
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

    const grouped = this.groupDueRowsByReminder(rows);

    return Promise.all(
      Array.from(grouped.entries()).map(async ([reminderId, data]) => ({
        reminderId,
        jid: data.jid,
        medicationNames: data.medicationNames,
        previousSkipped: await this.wasPreviousReminderSkipped(
          data.treatmentId,
          data.scheduledTime,
        ),
      })),
    );
  }

  private async wasPreviousReminderSkipped(
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

  private groupDueRowsByReminder(
    rows: DueReminderRow[],
  ): Map<string, GroupedDueReminderInterface> {
    const grouped = new Map<string, GroupedDueReminderInterface>();

    for (const r of rows) {
      const existing = grouped.get(r.reminderId);
      if (existing) {
        existing.medicationNames.push(r.medicationName);
      } else {
        grouped.set(r.reminderId, {
          jid: r.jid,
          medicationNames: [r.medicationName],
          treatmentId: r.treatmentId,
          scheduledTime: r.scheduledTime,
        });
      }
    }

    return grouped;
  }

  async markSent(reminderId: string, sentAt: Date = new Date()): Promise<void> {
    await this.db
      .update(reminders)
      .set({ sent: true, sentAt })
      .where(eq(reminders.id, reminderId));
  }

  async findAllForDay(day: Date): Promise<Reminder[]> {
    const startOfTheDay = new Date(day);
    startOfTheDay.setHours(0, 0, 0, 0);

    const endOfTheDay = new Date(day);
    endOfTheDay.setHours(23, 59, 59, 999);

    return this.db
      .select()
      .from(reminders)
      .where(
        and(
          lte(reminders.scheduledTime, endOfTheDay),
          gte(reminders.scheduledTime, startOfTheDay),
        ),
      );
  }

  // TODO: filtrar por usuário quando existir tabela de usuarios existir, mapeando jid → userId.
  // Hoje resolve o reminder enviado mais antigo ainda não respondido.
  private async resolvePending(
    _jid: string,
    confirmed: boolean,
  ): Promise<Reminder | null> {
    return this.db.transaction(async (tx) => {
      const [pending] = await tx
        .select()
        .from(reminders)
        .where(and(eq(reminders.sent, true), isNull(reminders.confirmed)))
        .orderBy(asc(reminders.sentAt))
        .limit(1);

      if (!pending) return null;

      const [row] = await tx
        .update(reminders)
        .set({ confirmed, confirmedAt: new Date() })
        .where(eq(reminders.id, pending.id))
        .returning();

      await this.createNextTreatmentReminder(row, tx);
      return row;
    });
  }

  async autoSkipExpired(graceMinutes: number): Promise<string[]> {
    const cutoff = new Date(Date.now() - graceMinutes * 60 * 1000);

    const expired = await this.db
      .select({ id: reminders.id })
      .from(reminders)
      .where(
        and(
          eq(reminders.sent, true),
          isNull(reminders.confirmed),
          lte(reminders.sentAt, cutoff),
        ),
      );

    const skipped: string[] = [];
    for (const { id } of expired) {
      try {
        await this.skipReminder(id);
        skipped.push(id);
      } catch (err) {
        if (err instanceof NotFoundException) continue;
        throw err;
      }
    }
    return skipped;
  }

  private toValues(input: Partial<CreateReminderInput>): Partial<NewReminder> {
    return {
      treatmentId: input.treatmentId,
      scheduledTime: toDate(input.scheduledTime) ?? undefined,
      sent: input.sent,
      sentAt: toDate(input.sentAt),
      confirmed: input.confirmed,
      confirmedAt: toDate(input.confirmedAt),
    };
  }

  private async createNextTreatmentReminder(
    reminder: Reminder,
    tx: PgTransaction<
      NodePgQueryResultHKT,
      Record<string, never>,
      ExtractTablesWithRelations<Record<string, never>>
    >,
  ) {
    const [treatment] = await tx
      .select()
      .from(treatments)
      .where(eq(treatments.id, reminder.treatmentId));

    if (!treatment) {
      throw new NotFoundException('Reminder is not related to any treatment.');
    }

    /**
      confirmedAt will always be a Date since this function can only
      be called after the reminder has been confimed or skipped
    **/
    const nextScheduledTime = new Date(reminder.confirmedAt as Date);

    nextScheduledTime.setHours(
      nextScheduledTime.getHours() + treatment.intervalHours,
    );

    const isScheduledTimePastTreatmentEnd =
      nextScheduledTime > treatment.endTime;
    if (isScheduledTimePastTreatmentEnd) {
      const delay = nextScheduledTime.getTime() - treatment.endTime.getTime();
      await this.delayTreatment(reminder.treatmentId, delay);
    }

    await tx.insert(reminders).values({
      treatmentId: treatment.id,
      scheduledTime: nextScheduledTime,
      sent: false,
      sentAt: null,
      confirmed: null,
      confirmedAt: null,
    });
  }

  private async delayTreatment(treatmentId: string, delay: number) {
    await this.db
      .update(treatments)
      .set({
        endTime: new Date(treatments.endTime._.data.getTime() + delay),
      })
      .where(eq(treatments.id, treatmentId));
  }
}
