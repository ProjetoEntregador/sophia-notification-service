import { Injectable, Logger } from '@nestjs/common';
import { WAMessage } from 'baileys';
import { MessageHandler } from '../interfaces/index.js';

@Injectable()
export class LogMessageHandler extends MessageHandler {
  private readonly logger = new Logger(LogMessageHandler.name);

  async handle(_message: WAMessage, jid: string, text: string): Promise<void> {
    this.logger.log(`Mensagem recebida de ${jid}: ${text}`);
  }
}
