import { Injectable, NotFoundException } from '@nestjs/common';
import { Reminder } from '../../domain/reminder.entity';
import { RemindersRepository } from '../../domain/reminders.repository.port';
import { Clock } from '../../../shared/ports/clock.port';

@Injectable()
export class SkipDoseUseCase {
  constructor(
    private readonly reminders: RemindersRepository,
    private readonly clock: Clock,
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
    await this.reminders.scheduleNextAfter(saved);
    return saved;
  }
}
