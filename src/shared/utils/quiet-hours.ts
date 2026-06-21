import { formatHourInTimezone } from './timezone';

export function isWithinQuietHours(
  at: Date,
  start: string | null,
  end: string | null,
): boolean {
  if (!start || !end) return false;
  const current = formatHourInTimezone(at);
  return inWindow(current, start, end);
}

function inWindow(current: string, start: string, end: string): boolean {
  const cur = toMinutes(current);
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (cur === null || s === null || e === null) return false;

  if (s === e) return false;
  if (s < e) return cur >= s && cur < e;
  return cur >= s || cur < e;
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}
