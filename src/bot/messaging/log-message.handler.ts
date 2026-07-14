import { Injectable, Logger } from '@nestjs/common';
import { MessageHandlerInterface } from '../interfaces/index';

@Injectable()
export class LogMessageHandler extends MessageHandlerInterface {
  private readonly logger = new Logger(LogMessageHandler.name);

  canHandle(): boolean {
    return true;
  }

  async handle(jid: string, text: string): Promise<void> {
    this.logger.log(`Mensagem recebida de ${jid}: ${text}`);
  }
}
