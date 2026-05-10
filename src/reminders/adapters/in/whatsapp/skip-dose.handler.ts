import { Injectable } from '@nestjs/common';
import { MessageHandlerInterface } from '@/bot/interfaces/index';
import { MessageSender } from '@/shared/ports/message-sender.port';
import { SkipDoseUseCase } from '@/reminders/application/use-cases/skip-dose.usecase';

@Injectable()
export class SkipDoseHandler extends MessageHandlerInterface {
  constructor(
    private readonly skipDose: SkipDoseUseCase,
    private readonly sender: MessageSender,
  ) {
    super();
  }

  canHandle(text: string): boolean {
    return text.trim() === '2';
  }

  async handle(jid: string): Promise<void> {
    const reminder = await this.skipDose.byJid(jid);
    const reply = reminder
      ? 'Anotado. Tente não pular a próxima 🙏'
      : 'Não encontrei nenhuma dose pendente para registrar.';
    await this.sender.typingMessage(jid);
    await this.sender.sendText(jid, reply);
  }
}
