import { forwardRef, Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { WhatsAppConnectionService } from './connection/whatsapp-connection.service';
import { WhatsAppSessionService } from './connection/whatsapp-session.service';
import { MessageService } from './messaging/message.service';
import { QrCodeTerminalPresenter } from './presenters/qr-code-terminal.presenter';
import {
  MessageHandlerRegistryInterface,
  MessageRouterInterface,
  QrCodePresenterInterface,
  SocketProviderInterface,
} from './interfaces/index';
import { RemindersModule } from '@/reminders/reminders.module';
import { TreatmentsModule } from '@/treatments/treatments.module';
import { MedicationsModule } from '@/medications/medications.module';
import { UsersModule } from '@/users/users.module';
import { PharmaciesModule } from '@/pharmacies/pharmacies.module';
import { MessageRouter } from './messaging/message-router.service';
import { StaticMessageHandlerRegistry } from './messaging/static-message-handler-registry';
import { ConversationStateService } from './messaging/state/conversation-state.service';
import { AiOrchestratorHandler } from './ai/ai-orchestrator.handler';
import { ChatHistoryService } from './ai/chat-history.service';
import { AiToolsRegistry } from './ai/ai-tools.registry';
import { LocalAiService } from './ai/local-ai.service';
import { LocalTranscriptionService } from './ai/local-transcription.service';
import {
  AiServiceInterface,
  TranscriptionServiceInterface,
} from './ai/interfaces/index';
import { MessageSender } from '@/shared/ports/message-sender.port';
import { RabbitMQService } from '@/infra/messaging/rabbitmq.service';

@Module({
  imports: [
    forwardRef(() => RemindersModule),
    forwardRef(() => TreatmentsModule),
    MedicationsModule,
    forwardRef(() => UsersModule),
    forwardRef(() => PharmaciesModule),
  ],
  controllers: [BotController],
  providers: [
    WhatsAppConnectionService,
    WhatsAppSessionService,
    BotService,
    MessageService,
    ConversationStateService,
    RabbitMQService,

    ChatHistoryService,
    AiToolsRegistry,
    AiOrchestratorHandler,
    LocalAiService,
    { provide: AiServiceInterface, useExisting: LocalAiService },
    LocalTranscriptionService,
    {
      provide: TranscriptionServiceInterface,
      useExisting: LocalTranscriptionService,
    },

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
  exports: [
    WhatsAppSessionService,
    MessageSender,
    ConversationStateService,
    { provide: MessageRouterInterface, useExisting: MessageRouter },
  ],
})
export class BotModule {}
