import { Injectable } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageHandlerRegistry,
} from '../interfaces/index.js';
import { ConfirmDoseHandler } from './handlers/confirm-dose.handler.js';
import { SkipDoseHandler } from './handlers/skip-dose.handler.js';
import { StartTreatmentHandler } from './handlers/start-treatment.handler.js';

@Injectable()
export class StaticMessageHandlerRegistry implements MessageHandlerRegistry {
  readonly handlers: ReadonlyArray<MessageHandlerInterface>;

  constructor(
    startTreatment: StartTreatmentHandler,
    confirmDose: ConfirmDoseHandler,
    skipDose: SkipDoseHandler,
  ) {
    this.handlers = [startTreatment, confirmDose, skipDose];
  }
}
