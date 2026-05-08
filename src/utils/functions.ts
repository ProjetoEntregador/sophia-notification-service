import { createHash } from 'node:crypto';
import { TreatmentDraft } from '../@types';

export function parseBrDate(input: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(input);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, mi] = match;
  const iso = `${yyyy}-${mm}-${dd}T${hh}:${mi}:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBrDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function jidToUserId(jid: string): string {
  const h = createHash('sha256').update(jid).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export function toDate(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

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
