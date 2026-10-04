const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86_400 } as const;

/** Converts a duration such as `24h` or `15m` (the `JWT_EXPIRES_IN` format) to seconds. */
export function durationToSeconds(duration: string): number {
  const match = /^([1-9]\d*)([smhd])$/.exec(duration);
  const [, amount, unit] = match ?? [];
  if (amount === undefined || unit === undefined) {
    throw new Error(`invalid duration "${duration}"`);
  }
  return Number(amount) * UNIT_SECONDS[unit as keyof typeof UNIT_SECONDS];
}
