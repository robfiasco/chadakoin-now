// Fair, deterministic rotation for which Featured partner gets the hero
// slot. Round-robin by hour rather than a persisted per-open counter: it's
// a pure function of wall-clock time, so there's no AsyncStorage read, no
// migration when the partner count changes, and no way for a stored index
// to drift or get stuck. Every partner gets an equal, predictable share of
// hero placement over time — this only changes which partner is styled as
// "hero"; every partner still renders in the block on every open.
export function heroIndex(partnerCount: number, now: Date = new Date()): number {
  if (partnerCount <= 0) return 0;
  const hoursSinceEpoch = Math.floor(now.getTime() / (60 * 60 * 1000));
  return hoursSinceEpoch % partnerCount;
}
