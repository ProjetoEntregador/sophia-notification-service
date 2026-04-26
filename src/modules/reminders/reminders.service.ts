import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
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
