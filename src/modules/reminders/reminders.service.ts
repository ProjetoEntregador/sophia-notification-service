import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database.module';
import { reminders } from '../../db/schema/reminders';
import { NewReminder, Reminder } from '../../db/schema/types';

type CreateReminderInput = {
  treatmentId: string;
  scheduledTime: string;
  sent?: boolean;
  sentAt?: string | null;
  confirmed?: boolean | null;
  confirmedAt?: string | null;
};

type UpdateReminderInput = Partial<CreateReminderInput>;

const toDate = (value: string | null | undefined): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
};

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

  async confirmDose(jid: string): Promise<Reminder | null> {
    return this.resolvePending(jid, true);
  }

  async skipDose(jid: string): Promise<Reminder | null> {
    return this.resolvePending(jid, false);
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
