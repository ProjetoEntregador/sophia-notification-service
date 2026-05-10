import { Injectable } from '@nestjs/common';
import { RemindersRepository } from '../../domain/reminders.repository.port';
import { Clock } from '../../../shared/ports/clock.port';

@Injectable()
export class AutoSkipExpiredRemindersUseCase {
  constructor(
    private readonly reminders: RemindersRepository,
    private readonly clock: Clock,
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
      await this.reminders.scheduleNextAfter(saved);
      skipped.push(saved.id);
    }
    return skipped;
  }
}
