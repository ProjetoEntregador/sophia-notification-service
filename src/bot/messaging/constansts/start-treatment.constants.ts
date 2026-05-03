import { TreatmentStep } from '../../../@types';
import {
  buildTreatmentSummary,
  parseBrDate,
} from '../../../utils/functions.js';

export const FLOW = 'start_treatment';
export const TRIGGERS = [
  'cadastrar',
  'novo tratamento',
  'cadastrar tratamento',
];
export const CANCEL_KEYWORD = 'cancelar';
export const CONFIRM_KEYWORDS = ['sim', 's'];

export const MESSAGES = {
  welcome:
    'Vamos cadastrar um novo tratamento. 💊\n(envie "cancelar" a qualquer momento)',
  cancelled: 'Cadastro cancelado.',
  success: 'Tratamento cadastrado com sucesso! ✅',
  invalidDate: 'Data inválida. Use o formato DD/MM/AAAA HH:mm.',
  emptyMedicine: 'Por favor, digite o nome do remédio.',
  invalidInterval: 'Número inválido. Digite um inteiro entre 1 e 24.',
  endBeforeStart: 'A data de término precisa ser depois do início.',
  confirmHelp: 'Responda *SIM* para confirmar ou *CANCELAR* para descartar.',
} as const;

export const STEPS: ReadonlyArray<TreatmentStep> = [
  // {
  //   prompt: () => 'Qual o nome do remédio?',
  //   process: (input) =>
  //     input.length === 0
  //       ? { kind: 'reject', reply: MESSAGES.emptyMedicine }
  //       : { kind: 'advance', patch: { medicineName: input } },
  // },
  {
    prompt: () => 'De quantas em quantas horas? (ex: 8)',
    process: (input) => {
      const hours = Number(input);
      if (!Number.isInteger(hours) || hours <= 0 || hours > 24) {
        return { kind: 'reject', reply: MESSAGES.invalidInterval };
      }
      return { kind: 'advance', patch: { intervalHours: hours } };
    },
  },
  {
    prompt: () => 'Quando começa? (formato: DD/MM/AAAA HH:mm)',
    process: (input) => {
      const date = parseBrDate(input);
      if (!date) return { kind: 'reject', reply: MESSAGES.invalidDate };
      return { kind: 'advance', patch: { startTime: date.toISOString() } };
    },
  },
  {
    prompt: () => 'E quando termina?',
    process: (input, draft) => {
      const date = parseBrDate(input);
      if (!date) return { kind: 'reject', reply: MESSAGES.invalidDate };

      const start = new Date(draft.startTime as string);
      if (date <= start) {
        return { kind: 'reject', reply: MESSAGES.endBeforeStart };
      }
      return { kind: 'advance', patch: { endTime: date.toISOString() } };
    },
  },
  {
    prompt: (draft) => buildTreatmentSummary(draft),
    process: (input) => {
      if (CONFIRM_KEYWORDS.includes(input.toLowerCase())) {
        return { kind: 'commit' };
      }
      return { kind: 'reject', reply: MESSAGES.confirmHelp };
    },
  },
];
