import { Injectable } from '@nestjs/common';
import { Clock } from '@/shared/ports/clock.port';
import { CreateNextReminderUseCase } from './create-next-reminder.usecase';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';

@Injectable()
export class AutoSkipExpiredRemindersUseCase {
  constructor(
    private readonly clock: Clock,
    private readonly reminders: RemindersRepository,
    private readonly createNextReminder: CreateNextReminderUseCase,
  ) {}

  async execute(graceMinutes: number): Promise<string[]> {
    const now = this.clock.now();
    const expired = await this.reminders.findExpired(now, graceMinutes);

    const skipped: string[] = [];
    for (const reminder of expired) {
      if (!reminder.isExpiredWithoutResponse(now, graceMinutes)) continue;
      const updated = reminder.skip(now);

      if (updated === reminder) continue;
      const saved = await this.reminders.save(updated);

      await this.createNextReminder.execute(saved);
      skipped.push(saved.id);
    }
    return skipped;
  }
}
