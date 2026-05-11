import { Injectable, NotFoundException } from '@nestjs/common';
import { Clock } from '@/shared/ports/clock.port';
import { Reminder } from '@/reminders/domain/reminder.entity';
import { CreateNextReminderUseCase } from './create-next-reminder.usecase';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

@Injectable()
export class SkipDoseUseCase {
  constructor(
    private readonly reminders: RemindersRepository,
    private readonly clock: Clock,
    private readonly createNextReminder: CreateNextReminderUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {}

  async byId(id: string): Promise<Reminder> {
    const reminder = await this.reminders.findById(id);
    if (!reminder || reminder.confirmed !== null) {
      throw new NotFoundException('No such reminder found.');
    }
    return this.skip(reminder);
  }

  async byJid(jid: string): Promise<Reminder | null> {
    const user = await this.ensureUser.execute(jid);
    const pending = await this.reminders.findOldestUnresolved(user.id);
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
