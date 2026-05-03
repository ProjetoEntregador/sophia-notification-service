import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gte, isNull, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database.module';
import { reminders } from '../../db/schema/reminders';
import { treatments } from '../../db/schema/treatments';
import {
  CreateReminderInput,
  NewReminder,
  Reminder,
  UpdateReminderInput,
} from '../../@types';
import { toDate } from '../../utils/functions';

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

    await this.db
      .update(treatments)
      .set({
        endTime: new Date(treatments.endTime._.data.getTime() + delay),
      })
      .where(eq(treatments.id, reminder.treatmentId));
  }

  async confirmReminder(id: string): Promise<void> {
    await this.db
      .update(reminders)
      .set({ confirmed: true, confirmedAt: new Date() })
      .where(eq(reminders.id, id));
  }

  async skipReminder(id: string): Promise<void> {
    await this.db
      .update(reminders)
      .set({ confirmed: false, confirmedAt: new Date() })
      .where(eq(reminders.id, id));
  }

  async confirmDose(jid: string): Promise<Reminder | null> {
    return this.resolvePending(jid, true);
  }

  async skipDose(jid: string): Promise<Reminder | null> {
    return this.resolvePending(jid, false);
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
    const [pending] = await this.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.sent, true), isNull(reminders.confirmed)))
      .orderBy(asc(reminders.sentAt))
      .limit(1);

    if (!pending) return null;

    const [row] = await this.db
      .update(reminders)
      .set({ confirmed, confirmedAt: new Date() })
      .where(eq(reminders.id, pending.id))
      .returning();
    return row;
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
}
