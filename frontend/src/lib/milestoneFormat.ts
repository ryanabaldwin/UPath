/** Format server-provided day counts for milestone ETA UI. */
export function formatTimeRemainingDays(days: number | null | undefined): string {
  if (days == null) return "—";
  if (days <= 0) return "Plan complete";
  if (days === 1) return "1 day";
  return `${days} days`;
}
