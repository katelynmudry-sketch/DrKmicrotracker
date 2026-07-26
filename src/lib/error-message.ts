/** Safe message extraction for catch-block errors (typed unknown). */
export function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}
