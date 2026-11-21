const IST_OFFSET_MS = 330 * 60 * 1000; // UTC+05:30, no DST

/**
 * Returns the India calendar day of `input` as a Date at 00:00 UTC.
 * Day-keyed rows (pricing overrides) are stored this way so the result
 * is identical whether the server runs in UTC or IST.
 * Accepts "YYYY-MM-DD" (taken literally) or any date/ISO string (converted to IST).
 */
export function istDay(input: string | Date): Date {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00.000Z`);
  }
  const shifted = new Date(new Date(input).getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}
