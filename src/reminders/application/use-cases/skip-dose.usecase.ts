import { Injectable, NotFoundException } from '@nestjs/common';
import { Clock } from '@/shared/ports/clock.port';
import { Reminder } from '@/reminders/domain/reminder.entity';
import { CreateNextReminderUseCase } from './create-next-reminder.usecase';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';

@Injectable()
export class SkipDoseUseCase {
  constructor(
    private readonly reminders: RemindersRepository,
    private readonly clock: Clock,
    private readonly createNextReminder: CreateNextReminderUseCase,
  ) {}

  async byId(id: string): Promise<Reminder> {
    const reminder = await this.reminders.findById(id);
    if (!reminder || reminder.confirmed !== null) {
      throw new NotFoundException('No such reminder found.');
    }
    return this.skip(reminder);
  }

  async byJid(jid: string): Promise<Reminder | null> {
    // TODO: filtrar por jid quando houver tabela de usuários ligando jid → reminders.
    void jid;
    const pending = await this.reminders.findOldestUnresolved();
    if (!pending) return null;
    return this.skip(pending);
  }

  private async skip(reminder: Reminder): Promise<Reminder> {
    const resolved = reminder.skip(this.clock.now());
    const saved = await this.reminders.save(resolved);
    await this.createNextReminder.execute(saved);
    return saved;
  }
}
