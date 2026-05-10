import { forwardRef, Module } from '@nestjs/common';
import { BotController } from './bot.controller.js';
import { BotService } from './bot.service.js';
import { WhatsAppConnectionService } from './connection/whatsapp-connection.service.js';
import { WhatsAppSessionService } from './connection/whatsapp-session.service.js';
import { MessageService } from './messaging/message.service.js';
import { QrCodeTerminalPresenter } from './presenters/qr-code-terminal.presenter.js';
import {
  MessageHandlerRegistryInterface,
  MessageRouterInterface,
  QrCodePresenterInterface,
  SocketProviderInterface,
} from './interfaces/index.js';
import { RemindersModule } from '../reminders/reminders.module';
import { TreatmentsModule } from '../treatments/treatments.module';
import { MedicationsModule } from '../medications/medications.module';
import { MessageRouter } from './messaging/message-router.service.js';
import { StaticMessageHandlerRegistry } from './messaging/static-message-handler-registry.js';
import { ConversationStateService } from './messaging/state/conversation-state.service.js';
import { AiOrchestratorHandler } from './ai/ai-orchestrator.handler.js';
import { ChatHistoryService } from './ai/chat-history.service.js';
import { AiToolsRegistry } from './ai/ai-tools.registry.js';
import { LocalAiService } from './ai/local-ai.service.js';
import { AiServiceInterface } from './ai/interfaces/index.js';
import { MessageSender } from '../shared/ports/message-sender.port';

@Module({
  imports: [
    forwardRef(() => RemindersModule),
    forwardRef(() => TreatmentsModule),
    MedicationsModule,
  ],
  controllers: [BotController],
  providers: [
    WhatsAppConnectionService,
    WhatsAppSessionService,
    BotService,
    MessageService,
    ConversationStateService,

    ChatHistoryService,
    AiToolsRegistry,
    AiOrchestratorHandler,
    LocalAiService,
    { provide: AiServiceInterface, useExisting: LocalAiService },

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
    { provide: MessageSender, useClass: MessageService },
  ],
  exports: [WhatsAppSessionService, MessageSender, ConversationStateService],
})
export class BotModule {}
