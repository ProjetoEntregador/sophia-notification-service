import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from '../../modules/reminders/reminders.service';
import { MessageSenderInterface } from '../interfaces/index.js';

@Injectable()
export class RemindersDispatchCron {
  private readonly logger = new Logger(RemindersDispatchCron.name);
  private running = false;

  constructor(
    private readonly reminders: RemindersService,
    private readonly sender: MessageSenderInterface,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchPending(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const due = await this.reminders.findDueReminders();
      if (due.length === 0) return;

      this.logger.log(`Disparando ${due.length} reminder(s)`);

      for (const { reminderId, jid, medicationNames, previousSkipped } of due) {
        try {
          const meds = medicationNames.join(', ');
          const prefix = previousSkipped
            ? '⚠️ A dose anterior foi marcada como *pulada* (sem resposta).\n\n'
            : '';
          const text =
            prefix +
            `⏰ Hora de tomar ${meds}!\n` +
            `Responda *1* para confirmar a dose ou *2* para pular.`;
          await this.sender.typingMessage(jid);
          await this.sender.sendText(jid, text);
          await this.reminders.markSent(reminderId);
        } catch (err) {
          this.logger.error(
            `Falha ao enviar reminder ${reminderId}: ${(err as Error).message}`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
