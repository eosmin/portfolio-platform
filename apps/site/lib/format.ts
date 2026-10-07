const monthYear = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Format an ISO date or datetime as e.g. "Mar 2024" (UTC, so the server and browser agree). */
export function formatMonthYear(iso: string): string {
  return monthYear.format(new Date(iso));
}
