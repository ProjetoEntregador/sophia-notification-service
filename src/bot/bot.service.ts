import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WhatsAppSessionService } from './connection/whatsapp-session.service';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);

  constructor(private readonly session: WhatsAppSessionService) {}

  onModuleInit(): void {
    this.logger.log('Iniciando sessão WhatsApp...');
    void this.session
      .start()
      .catch((err) =>
        this.logger.error('Falha ao iniciar sessão WhatsApp', err),
      );
  }
}
