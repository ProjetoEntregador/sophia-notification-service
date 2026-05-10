import { Injectable } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageSenderInterface,
} from '../../interfaces/index.js';
import { ConfirmDoseUseCase } from '../../../reminders/application/use-cases/confirm-dose.usecase';

@Injectable()
export class ConfirmDoseHandler extends MessageHandlerInterface {
  constructor(
    private readonly confirmDose: ConfirmDoseUseCase,
    private readonly sender: MessageSenderInterface,
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
