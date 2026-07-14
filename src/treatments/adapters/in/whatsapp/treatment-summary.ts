import { formatBrDate } from '@/utils/functions';
import { TreatmentDraft } from './types/treatment-flow.types';

export function buildTreatmentSummary(draft: TreatmentDraft): string {
  const start = new Date(draft.startTime as string);
  const end = new Date(draft.endTime as string);
  return [
    'Confirma os dados?',
    `💊 ${draft.medications?.join(', ') as string}`,
    `⏱ De ${draft.intervalHours as number} em ${draft.intervalHours as number} horas`,
    `📅 ${formatBrDate(start)} → ${formatBrDate(end)}`,
    '',
    'Responda *SIM* para confirmar ou *CANCELAR*.',
  ].join('\n');
}
