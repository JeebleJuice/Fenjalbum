export type DateBounds = { from: Date; to: Date };

function validUtcDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function parseSearchToken(value: string): DateBounds | null {
  const year = /^(\d{4})$/.exec(value.trim());
  if (year) {
    const numericYear = Number(year[1]);
    if (numericYear < 1900 || numericYear > 2200) return null;
    return {
      from: new Date(Date.UTC(numericYear, 0, 1)),
      to: new Date(Date.UTC(numericYear, 11, 31, 23, 59, 59, 999))
    };
  }
  const date = parseCalendarDate(value);
  return date ? { from: startOfDay(date), to: endOfDay(date) } : null;
}

export function parseCalendarDate(value: string) {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (iso) return validUtcDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const european = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(trimmed);
  if (european) return validUtcDate(Number(european[3]), Number(european[2]), Number(european[1]));
  return null;
}

export function parseDateSearch(value: string): DateBounds | null {
  const parts = value.trim().split(/\s+(?:-|–|—|to)\s+/i);
  if (parts.length > 2) return null;
  const first = parseSearchToken(parts[0] ?? "");
  const second = parts.length === 2 ? parseSearchToken(parts[1] ?? "") : first;
  if (!first || !second) return null;
  const chronological = first.from <= second.from;
  const from = chronological ? first.from : second.from;
  const to = chronological ? second.to : first.to;
  return { from, to };
}

export function explicitDateBounds(fromValue?: string, toValue?: string): Partial<DateBounds> {
  const from = fromValue ? parseCalendarDate(fromValue) : null;
  const to = toValue ? parseCalendarDate(toValue) : null;
  return {
    ...(from ? { from: startOfDay(from) } : {}),
    ...(to ? { to: endOfDay(to) } : {})
  };
}
