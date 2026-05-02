import { Injectable } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageSenderInterface,
} from '../../interfaces/index.js';
import { TreatmentsService } from '../../../modules/treatments/treatments.service.js';
import { ConversationStateService } from '../state/conversation-state.service.js';
import { jidToUserId } from '../../../utils/functions.js';
import {
  ConversationState,
  TreatmentDraft,
  TreatmentStepResult,
} from '../../../@types';
import {
  CANCEL_KEYWORD,
  FLOW,
  MESSAGES,
  STEPS,
  TRIGGERS,
} from '../constansts/start-treatment.constants.js';

@Injectable()
export class StartTreatmentHandler extends MessageHandlerInterface {
  readonly flowName = FLOW;

  constructor(
    private readonly treatments: TreatmentsService,
    private readonly state: ConversationStateService,
    private readonly sender: MessageSenderInterface,
  ) {
    super();
  }

  canHandle(text: string): boolean {
    return TRIGGERS.includes(text.trim().toLowerCase());
  }

  async handle(jid: string, text: string): Promise<void> {
    const input = text.trim();

    if (this.isCancel(input)) {
      return this.cancelFlow(jid);
    }

    const current = this.state.get(jid);
    if (!this.isInFlow(current)) {
      return this.startFlow(jid);
    }

    return this.advanceFlow(jid, input, current);
  }

  private isCancel(input: string): boolean {
    return input.toLowerCase() === CANCEL_KEYWORD;
  }

  private isInFlow(
    state: ConversationState | undefined,
  ): state is ConversationState {
    return !!state && state.flow === FLOW;
  }

  private async cancelFlow(jid: string): Promise<void> {
    this.state.clear(jid);
    await this.reply(jid, MESSAGES.cancelled);
  }

  private async startFlow(jid: string): Promise<void> {
    this.state.set(jid, { flow: FLOW, step: 0, data: {} });
    await this.reply(jid, `${MESSAGES.welcome}\n\n${STEPS[0].prompt({})}`);
  }

  private async advanceFlow(
    jid: string,
    input: string,
    current: ConversationState,
  ): Promise<void> {
    const stepIndex = current.step as number;
    const draft = current.data as TreatmentDraft;
    const result = STEPS[stepIndex].process(input, draft);

    if (result.kind === 'reject') {
      return this.reply(jid, result.reply);
    }

    if (result.kind === 'commit') {
      return this.commitFlow(jid, draft);
    }

    return this.moveToNextStep(jid, stepIndex, draft, result);
  }

  private async commitFlow(jid: string, draft: TreatmentDraft): Promise<void> {
    await this.persist(jid, draft);
    this.state.clear(jid);
    await this.reply(jid, MESSAGES.success);
  }

  private async moveToNextStep(
    jid: string,
    currentIndex: number,
    draft: TreatmentDraft,
    result: Extract<TreatmentStepResult, { kind: 'advance' }>,
  ): Promise<void> {
    const nextDraft = { ...draft, ...result.patch };
    const nextIndex = currentIndex + 1;
    this.state.set(jid, { flow: FLOW, step: nextIndex, data: nextDraft });
    await this.reply(jid, STEPS[nextIndex].prompt(nextDraft));
  }

  private async reply(jid: string, message: string): Promise<void> {
    await this.sender.typingMessage(jid);
    await this.sender.sendText(jid, message);
  }

  private async persist(jid: string, draft: TreatmentDraft): Promise<void> {
    await this.treatments.create({
      userId: jidToUserId(jid),
      jid,
      medicineName: draft.medicineName as string,
      intervalHours: draft.intervalHours as number,
      startTime: draft.startTime as string,
      endTime: draft.endTime as string,
    });
  }
}
