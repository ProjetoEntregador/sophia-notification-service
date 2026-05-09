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
import { MedicationsModule } from '../modules/medications/medications.module.js';
import { MessageRouter } from './messaging/message-router.service.js';
import { StaticMessageHandlerRegistry } from './messaging/static-message-handler-registry.js';
import { ConversationStateService } from './messaging/state/conversation-state.service.js';
import { AiOrchestratorHandler } from './ai/ai-orchestrator.handler.js';
import { ChatHistoryService } from './ai/chat-history.service.js';
import { AiToolsRegistry } from './ai/ai-tools.registry.js';
import { RegisterMedicationTool } from './ai/tools/register-medication.tool.js';
import { RegisterTreatmentTool } from './ai/tools/register-treatment.tool.js';
import { ConfirmDoseTool } from './ai/tools/confirm-dose.tool.js';
import { SkipDoseTool } from './ai/tools/skip-dose.tool.js';
import { LocalAiService } from './ai/local-ai.service.js';
import { AiServiceInterface } from './ai/interfaces/index.js';
import { RemindersDispatchCron } from './cron/reminders-dispatch.cron.js';

@Module({
  imports: [RemindersModule, TreatmentsModule, MedicationsModule],
  controllers: [BotController],
  providers: [
    WhatsAppConnectionService,
    WhatsAppSessionService,
    BotService,
    MessageService,
    ConversationStateService,

    ConfirmDoseHandler,
    SkipDoseHandler,
    StartTreatmentHandler,

    ChatHistoryService,
    RegisterMedicationTool,
    RegisterTreatmentTool,
    ConfirmDoseTool,
    SkipDoseTool,
    AiToolsRegistry,
    AiOrchestratorHandler,
    LocalAiService,
    RemindersDispatchCron,
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
    { provide: MessageSenderInterface, useClass: MessageService },
  ],
  exports: [WhatsAppSessionService, MessageSenderInterface],
})
export class BotModule {}
