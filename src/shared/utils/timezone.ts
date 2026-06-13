export const APP_TIMEZONE = 'America/Sao_Paulo';

function getOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const dateMap = new Map(parts.map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(dateMap.get('year')),
    Number(dateMap.get('month')) - 1,
    Number(dateMap.get('day')),
    Number(dateMap.get('hour')) === 24 ? 0 : Number(dateMap.get('hour')),
    Number(dateMap.get('minute')),
    Number(dateMap.get('second')),
  );
  return asUtc - date.getTime();
}

export function startOfDayInTimezone(
  date: Date,
  timeZone: string = APP_TIMEZONE,
): Date {
  const offset = getOffsetMs(date, timeZone);
  const localMidnight = new Date(date.getTime() + offset);
  localMidnight.setUTCHours(0, 0, 0, 0);
  return new Date(localMidnight.getTime() - offset);
}

export function endOfDayInTimezone(
  date: Date,
  timeZone: string = APP_TIMEZONE,
): Date {
  const offset = getOffsetMs(date, timeZone);
  const localMidnight = new Date(date.getTime() + offset);
  localMidnight.setUTCHours(23, 59, 59, 999);
  return new Date(localMidnight.getTime() - offset);
}

export function formatInTimezone(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  timeZone: string = APP_TIMEZONE,
): string {
  return date.toLocaleString('pt-BR', { ...options, timeZone });
}

export function formatHourInTimezone(
  date: Date,
  timeZone: string = APP_TIMEZONE,
): string {
  return formatInTimezone(
    date,
    { hour: '2-digit', minute: '2-digit' },
    timeZone,
  );
}

export function formatDateTimeInTimezone(
  date: Date,
  timeZone: string = APP_TIMEZONE,
): string {
  return formatInTimezone(
    date,
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    timeZone,
  );
}
