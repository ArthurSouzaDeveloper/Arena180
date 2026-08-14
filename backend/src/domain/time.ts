export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Interprets a `date` (YYYY-MM-DD) + `time` (HH:MM) pair as Brazil local time
 * (fixed UTC-03:00, no DST since 2019), regardless of the server's own timezone.
 * A naive `new Date(\`${date}T${time}:00\`)` would be parsed in the server's
 * local timezone instead, which silently shifts every comparison against
 * `new Date()` when the server doesn't run in America/Sao_Paulo (e.g. a UTC
 * Docker container).
 */
export function toBrazilDateTime(date: string, time = "00:00"): Date {
  return new Date(`${date}T${time}:00-03:00`);
}
