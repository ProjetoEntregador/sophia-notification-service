import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WhatsAppSessionService } from './connection/whatsapp-session.service.js';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);

  constructor(private readonly session: WhatsAppSessionService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Iniciando sessão WhatsApp...');
    await this.session.start();
  }
}
