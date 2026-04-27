import { createHash } from 'node:crypto';

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
