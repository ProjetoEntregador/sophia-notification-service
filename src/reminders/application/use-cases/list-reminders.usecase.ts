import { Injectable, NotFoundException } from '@nestjs/common';
import { Reminder } from '../../domain/reminder.entity';
import { RemindersRepository } from '../../domain/reminders.repository.port';

@Injectable()
export class ListRemindersUseCase {
  constructor(private readonly reminders: RemindersRepository) {}

  findAll(): Promise<Reminder[]> {
    return this.reminders.findAll();
  }

  async findOne(id: string): Promise<Reminder> {
    const reminder = await this.reminders.findById(id);
    if (!reminder) throw new NotFoundException(`Reminder ${id} not found`);
    return reminder;
  }

  findInDay(day: Date): Promise<Reminder[]> {
    return this.reminders.findInDay(day);
  }

  findInDateRange(start: Date, end: Date): Promise<Reminder[]> {
    return this.reminders.findInDateRange(start, end);
  }
}
