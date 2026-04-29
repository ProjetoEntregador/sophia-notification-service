import { Module } from '@nestjs/common';
import { BotController } from './bot.controller.js';
import { BotService } from './bot.service.js';
import { WhatsAppConnectionService } from './connection/whatsapp-connection.service.js';
import { WhatsAppSessionService } from './connection/whatsapp-session.service.js';
import { MessageService } from './messaging/message.service.js';
import { QrCodeTerminalPresenter } from './presenters/qr-code-terminal.presenter.js';
import {
  MessageHandlerRegistryInterface,
  MessageRouterInterface,
  MessageSenderInterface,
  QrCodePresenterInterface,
  SocketProviderInterface,
} from './interfaces/index.js';
import { ConfirmDoseHandler } from './messaging/handlers/confirm-dose.handler.js';
import { SkipDoseHandler } from './messaging/handlers/skip-dose.handler.js';
import { StartTreatmentHandler } from './messaging/handlers/start-treatment.handler.js';
import { RemindersModule } from '../modules/reminders/reminders.module.js';
import { TreatmentsModule } from '../modules/treatments/treatments.module.js';
import { MessageRouter } from './messaging/message-router.service.js';
import { StaticMessageHandlerRegistry } from './messaging/static-message-handler-registry.js';
import { ConversationStateService } from './messaging/state/conversation-state.service.js';

@Module({
  imports: [RemindersModule, TreatmentsModule],
  controllers: [BotController],
  providers: [
    WhatsAppConnectionService,
    WhatsAppSessionService,
    BotService,
    MessageService,
    ConversationStateService,

    // Handlers de mensagens
    ConfirmDoseHandler,
    SkipDoseHandler,
    StartTreatmentHandler,

    StaticMessageHandlerRegistry,
    {
      provide: MessageHandlerRegistryInterface,
      useExisting: StaticMessageHandlerRegistry,
    },
    MessageRouter,
    { provide: MessageRouterInterface, useExisting: MessageRouter },
    {
      provide: SocketProviderInterface,
      useExisting: WhatsAppConnectionService,
    },
    { provide: QrCodePresenterInterface, useClass: QrCodeTerminalPresenter },
    { provide: MessageSenderInterface, useClass: MessageService },
  ],
  exports: [WhatsAppSessionService, MessageSenderInterface],
})
export class BotModule {}
