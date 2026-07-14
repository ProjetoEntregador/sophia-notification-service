import { Injectable } from '@nestjs/common';
import { Reminder } from '@/reminders/domain/reminder.entity';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { Clock } from '@/shared/ports/clock.port';

@Injectable()
export class ListTodayRemindersUseCase {
  constructor(
    private readonly reminders: RemindersRepository,
    private readonly clock: Clock,
  ) {}

  execute(userId: string): Promise<Reminder[]> {
    return this.reminders.findByUserIdAndDay(userId, this.clock.now());
  }
}
