import { Injectable } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageSenderInterface,
} from '../../interfaces/index.js';
import { RemindersService } from '../../../modules/reminders/reminders.service.js';

@Injectable()
export class ConfirmDoseHandler extends MessageHandlerInterface {
  constructor(
    private readonly remindersService: RemindersService,
    private readonly sender: MessageSenderInterface,
  ) {
    super();
  }

  canHandle(text: string): boolean {
    return text.trim() === '1';
  }

  async handle(jid: string): Promise<void> {
    const reminder = await this.remindersService.confirmDose(jid);
    const reply = reminder
      ? 'Dose confirmada ✅ Continue assim!'
      : 'Não encontrei nenhuma dose pendente para confirmar.';
    await this.sender.typingMessage(jid);
    await this.sender.sendText(jid, reply);
  }
}
