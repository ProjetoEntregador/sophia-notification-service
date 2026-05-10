import { Injectable } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageSenderInterface,
} from '../../interfaces/index.js';
import { SkipDoseUseCase } from '../../../reminders/application/use-cases/skip-dose.usecase';

@Injectable()
export class SkipDoseHandler extends MessageHandlerInterface {
  constructor(
    private readonly skipDose: SkipDoseUseCase,
    private readonly sender: MessageSenderInterface,
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
