type DateValue = Date | string | number;

function asValidDate(value: DateValue) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDisplayDate(value: DateValue) {
  const date = asValidDate(value);
  if (!date) return "Unknown";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDisplayDateTime(value: DateValue) {
  const date = asValidDate(value);
  if (!date) return "Unknown";
  return `${formatDisplayDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
