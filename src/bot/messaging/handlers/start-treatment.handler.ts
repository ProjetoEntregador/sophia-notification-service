import { Injectable } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageSender,
} from '../../interfaces/index.js';
import { TreatmentsService } from '../../../modules/treatments/treatments.service.js';
import { ConversationStateService } from '../state/conversation-state.service.js';
import {
  buildTreatmentSummary,
  jidToUserId,
  parseBrDate,
} from '../../../utils/functions.js';
import { TreatmentDraft, TreatmentStep } from '../../../@types';

const FLOW = 'start_treatment';
const TRIGGERS = ['cadastrar', 'novo tratamento', 'cadastrar tratamento'];
const WELCOME =
  'Vamos cadastrar um novo tratamento. 💊\n(envie "cancelar" a qualquer momento)';

const STEPS: ReadonlyArray<TreatmentStep> = [
  {
    prompt: () => 'Qual o nome do remédio?',
    process: (input) =>
      input.length === 0
        ? { kind: 'reject', reply: 'Por favor, digite o nome do remédio.' }
        : { kind: 'advance', patch: { medicineName: input } },
  },
  {
    prompt: () => 'De quantas em quantas horas? (ex: 8)',
    process: (input) => {
      const hours = Number(input);
      if (!Number.isInteger(hours) || hours <= 0 || hours > 24) {
        return {
          kind: 'reject',
          reply: 'Número inválido. Digite um inteiro entre 1 e 24.',
        };
      }
      return { kind: 'advance', patch: { intervalHours: hours } };
    },
  },
  {
    prompt: () => 'Quando começa? (formato: DD/MM/AAAA HH:mm)',
    process: (input) => {
      const date = parseBrDate(input);
      if (!date) {
        return {
          kind: 'reject',
          reply: 'Data inválida. Use o formato DD/MM/AAAA HH:mm.',
        };
      }
      return { kind: 'advance', patch: { startTime: date.toISOString() } };
    },
  },
  {
    prompt: () => 'E quando termina?',
    process: (input, draft) => {
      const date = parseBrDate(input);
      if (!date) {
        return {
          kind: 'reject',
          reply: 'Data inválida. Use o formato DD/MM/AAAA HH:mm.',
        };
      }
      const start = new Date(draft.startTime as string);
      if (date <= start) {
        return {
          kind: 'reject',
          reply: 'A data de término precisa ser depois do início.',
        };
      }
      return { kind: 'advance', patch: { endTime: date.toISOString() } };
    },
  },
  {
    prompt: (draft) => buildTreatmentSummary(draft),
    process: (input) => {
      const lower = input.toLowerCase();
      if (lower === 'sim' || lower === 's') return { kind: 'commit' };
      return {
        kind: 'reject',
        reply: 'Responda *SIM* para confirmar ou *CANCELAR* para descartar.',
      };
    },
  },
];

@Injectable()
export class StartTreatmentHandler implements MessageHandlerInterface {
  readonly flowName = FLOW;

  constructor(
    private readonly treatments: TreatmentsService,
    private readonly state: ConversationStateService,
    private readonly sender: MessageSender,
  ) {}

  canHandle(text: string): boolean {
    return TRIGGERS.includes(text.trim().toLowerCase());
  }

  async handle(jid: string, text: string): Promise<void> {
    const input = text.trim();

    if (input.toLowerCase() === 'cancelar') {
      this.state.clear(jid);
      await this.sender.typingMessage(jid);
      await this.sender.sendText(jid, 'Cadastro cancelado.');
      return;
    }

    const current = this.state.get(jid);

    if (!current || current.flow !== FLOW) {
      this.state.set(jid, { flow: FLOW, step: 0, data: {} });
      await this.sender.typingMessage(jid);
      await this.sender.sendText(jid, `${WELCOME}\n\n${STEPS[0].prompt({})}`);
      return;
    }

    const stepIndex = current.step as number;
    const draft = current.data as TreatmentDraft;
    const result = STEPS[stepIndex].process(input, draft);

    if (result.kind === 'reject') {
      await this.sender.typingMessage(jid);
      await this.sender.sendText(jid, result.reply);
      return;
    }

    if (result.kind === 'commit') {
      await this.persist(jid, draft);
      this.state.clear(jid);
      await this.sender.typingMessage(jid);
      await this.sender.sendText(jid, 'Tratamento cadastrado com sucesso! ✅');
      return;
    }

    const nextDraft = { ...draft, ...result.patch };
    const nextIndex = stepIndex + 1;
    this.state.set(jid, { flow: FLOW, step: nextIndex, data: nextDraft });
    await this.sender.typingMessage(jid);
    await this.sender.sendText(jid, STEPS[nextIndex].prompt(nextDraft));
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
