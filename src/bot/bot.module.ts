import { Module } from '@nestjs/common';
import { BotController } from './bot.controller.js';
import { BotService } from './bot.service.js';
import { WhatsAppConnectionService } from './connection/whatsapp-connection.service.js';
import { WhatsAppSessionService } from './connection/whatsapp-session.service.js';
import { MessageService } from './messaging/message.service.js';
import { QrCodeTerminalPresenter } from './presenters/qr-code-terminal.presenter.js';
import { LogMessageHandler } from './messaging/log-message.handler.js';
import {
  MessageHandler,
  MessageSender,
  QrCodePresenter,
  SocketProvider,
} from './interfaces/index.js';

@Module({
  controllers: [BotController],
  providers: [
    WhatsAppConnectionService,
    WhatsAppSessionService,
    {
      provide: SocketProvider,
      useExisting: WhatsAppConnectionService,
    },
    {
      provide: QrCodePresenter,
      useClass: QrCodeTerminalPresenter,
    },
    {
      provide: MessageSender,
      useClass: MessageService,
    },
    {
      provide: MessageHandler,
      useClass: LogMessageHandler,
    },
    MessageService,
    BotService,
  ],
  exports: [WhatsAppSessionService, MessageSender],
})
export class BotModule {}
