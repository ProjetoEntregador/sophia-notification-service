import { Injectable } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageHandlerRegistryInterface,
} from '../interfaces/index.js';
import { ConfirmDoseHandler } from '../../reminders/adapters/in/whatsapp/confirm-dose.handler';
import { SkipDoseHandler } from '../../reminders/adapters/in/whatsapp/skip-dose.handler';
import { StartTreatmentHandler } from '../../treatments/adapters/in/whatsapp/start-treatment.handler';
import { AiOrchestratorHandler } from '../ai/ai-orchestrator.handler.js';

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
