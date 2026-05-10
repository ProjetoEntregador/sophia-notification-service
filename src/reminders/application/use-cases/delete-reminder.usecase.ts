import { Injectable, NotFoundException } from '@nestjs/common';
import { RemindersRepository } from '../../domain/reminders.repository.port';

@Injectable()
export class DeleteReminderUseCase {
  constructor(private readonly reminders: RemindersRepository) {}

  async execute(id: string): Promise<void> {
    const removed = await this.reminders.delete(id);
    if (!removed) throw new NotFoundException(`Reminder ${id} not found`);
  }
}
