export function parseRangeHeader(value: string | null, size: number) {
  if (!value || !value.startsWith("bytes=")) return null;
  const [startText, endText] = value.slice(6).split("-");
  const start = startText ? Number(startText) : 0;
  const end = endText ? Number(endText) : size - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end < start || end >= size) return null;
  return { start, end };
}
