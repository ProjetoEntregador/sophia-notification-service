import { Injectable } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageHandlerRegistryInterface,
} from '../interfaces/index';
import { AiOrchestratorHandler } from '../ai/ai-orchestrator.handler';
import { SkipDoseHandler } from '@/reminders/adapters/in/whatsapp/skip-dose.handler';
import { ConfirmDoseHandler } from '@/reminders/adapters/in/whatsapp/confirm-dose.handler';
import { StartTreatmentHandler } from '@/treatments/adapters/in/whatsapp/start-treatment.handler';

@Injectable()
export class StaticMessageHandlerRegistry extends MessageHandlerRegistryInterface {
  readonly handlers: ReadonlyArray<MessageHandlerInterface>;

  constructor(
    startTreatment: StartTreatmentHandler,
    confirmDose: ConfirmDoseHandler,
    skipDose: SkipDoseHandler,
    aiOrchestrator: AiOrchestratorHandler,
  ) {
    super();
    this.handlers = [startTreatment, confirmDose, skipDose, aiOrchestrator];
  }
}
