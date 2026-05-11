import { Injectable } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageHandlerRegistryInterface,
} from '../interfaces/index';
import { AiOrchestratorHandler } from '../ai/ai-orchestrator.handler';
import { SkipDoseHandler } from '@/reminders/adapters/in/whatsapp/skip-dose.handler';
import { ConfirmDoseHandler } from '@/reminders/adapters/in/whatsapp/confirm-dose.handler';
import { StartTreatmentHandler } from '@/treatments/adapters/in/whatsapp/start-treatment.handler';
import { TransferJidHandler } from '@/users/adapters/in/whatsapp/transfer-jid.handler';
import { ShowTokenHandler } from '@/users/adapters/in/whatsapp/show-token.handler';

@Injectable()
export class StaticMessageHandlerRegistry extends MessageHandlerRegistryInterface {
  readonly handlers: ReadonlyArray<MessageHandlerInterface>;

  constructor(
    transferJid: TransferJidHandler,
    showToken: ShowTokenHandler,
    startTreatment: StartTreatmentHandler,
    confirmDose: ConfirmDoseHandler,
    skipDose: SkipDoseHandler,
    aiOrchestrator: AiOrchestratorHandler,
  ) {
    super();
    this.handlers = [
      transferJid,
      showToken,
      startTreatment,
      confirmDose,
      skipDose,
      aiOrchestrator,
    ];
  }
}
