import { Injectable } from '@nestjs/common';
import { MessageHandlerInterface } from '@/bot/interfaces/index';
import { MessageSender } from '@/shared/ports/message-sender.port';
import { ConfirmDoseUseCase } from '@/reminders/application/use-cases/confirm-dose.usecase';

@Injectable()
export class ConfirmDoseHandler extends MessageHandlerInterface {
  constructor(
    private readonly confirmDose: ConfirmDoseUseCase,
    private readonly sender: MessageSender,
  ) {
    super();
  }

  canHandle(text: string): boolean {
    return text.trim() === '1';
  }

  async handle(jid: string): Promise<void> {
    const reminder = await this.confirmDose.byJid(jid);
    const reply = reminder
      ? 'Dose confirmada ✅ Continue assim!'
      : 'Não encontrei nenhuma dose pendente para confirmar.';
    await this.sender.typingMessage(jid);
    await this.sender.sendText(jid, reply);
  }
}
