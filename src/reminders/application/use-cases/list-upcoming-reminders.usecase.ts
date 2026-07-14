import { BadRequestException, Injectable } from '@nestjs/common';
import { Reminder } from '@/reminders/domain/reminder.entity';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { Clock } from '@/shared/ports/clock.port';

@Injectable()
export class ListUpcomingRemindersUseCase {
  constructor(
    private readonly reminders: RemindersRepository,
    private readonly clock: Clock,
  ) {}

  execute(userId: string, daysAhead: number): Promise<Reminder[]> {
    if (!Number.isInteger(daysAhead) || daysAhead < 1 || daysAhead > 30) {
      throw new BadRequestException('daysAhead deve ser inteiro entre 1 e 30');
    }
    const from = this.clock.now();
    const until = new Date(from.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return this.reminders.findUpcomingByUserId(userId, from, until);
  }
}
