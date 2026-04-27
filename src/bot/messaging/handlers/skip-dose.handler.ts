import { Injectable } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageSender,
} from '../../interfaces/index.js';
import { RemindersService } from '../../../modules/reminders/reminders.service.js';

@Injectable()
export class SkipDoseHandler extends MessageHandlerInterface {
  constructor(
    private readonly remindersService: RemindersService,
    private readonly sender: MessageSender,
  ) {
    super();
  }

  canHandle(text: string): boolean {
    return text.trim() === '2';
  }

  async handle(jid: string): Promise<void> {
    const reminder = await this.remindersService.skipDose(jid);
    const reply = reminder
      ? 'Anotado. Tente não pular a próxima 🙏'
      : 'Não encontrei nenhuma dose pendente para registrar.';
    await this.sender.typingMessage(jid);
    await this.sender.sendText(jid, reply);
  }
}
