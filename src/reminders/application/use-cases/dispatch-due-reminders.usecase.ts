import { Injectable, Logger } from '@nestjs/common';
import { Clock } from '@/shared/ports/clock.port';
import { MessageSender } from '@/shared/ports/message-sender.port';
import { RemindersRepository } from '@/reminders/domain/reminders.repository.port';
import { isWithinQuietHours } from '@/shared/utils/quiet-hours';

@Injectable()
export class DispatchDueRemindersUseCase {
  private readonly logger = new Logger(DispatchDueRemindersUseCase.name);

  constructor(
    private readonly reminders: RemindersRepository,
    private readonly sender: MessageSender,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<void> {
    const now = this.clock.now();
    const due = await this.reminders.findDue(now);
    if (due.length === 0) return;

    const deliverable = due.filter(
      (d) => !isWithinQuietHours(now, d.quietHoursStart, d.quietHoursEnd),
    );

    const silenced = due.length - deliverable.length;

    if (silenced > 0) {
      this.logger.debug(
        `${silenced} reminder(s) adiados por estarem dentro da janela de silêncio do paciente.`,
      );
    }
    if (deliverable.length === 0) return;

    this.logger.log(`Disparando ${deliverable.length} reminder(s)`);

    for (const item of deliverable) {
      try {
        const meds = item.medicationNames.join(', ');
        const prefix = item.previousSkipped
          ? '⚠️ A dose anterior foi marcada como *pulada* (sem resposta).\n\n'
          : '';
        const text =
          prefix +
          `⏰ Hora de tomar ${meds}!\n` +
          `Responda *1* para confirmar a dose ou *2* para pular.`;

        await this.sender.typingMessage(item.jid);
        await this.sender.sendText(item.jid, text);

        const reminder = await this.reminders.findById(item.reminderId);
        if (reminder) {
          await this.reminders.save(reminder.markSent(this.clock.now()));
        }
      } catch (err) {
        this.logger.error(
          `Falha ao enviar reminder ${item.reminderId}: ${(err as Error).message}`,
        );
      }
    }
  }
}
