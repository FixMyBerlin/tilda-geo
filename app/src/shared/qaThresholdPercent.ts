// QA thresholds are stored as a 0–1 fraction (`QaConfig.goodThreshold`/`needsReviewThreshold`);
// the admin form shows and edits them as a percent. Shared by the server form schema and the
// admin UI so the conversion happens in one place.

/** Decimal places kept when a 0–1 fraction is shown as a percent in the admin UI. */
const PERCENT_DISPLAY_DECIMALS = 2
/** Decimal places kept when an admin-entered percent is stored back as a 0–1 fraction. */
const FRACTION_STORAGE_DECIMALS = 4

export function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * 0.1 -> 10 for display/editing. `QaConfig.goodThreshold`/`needsReviewThreshold` are stored as a
 * 0–1 fraction; the admin form shows and edits the equivalent percent. Rounds away float noise
 * (e.g. `0.29 * 100 === 28.999999999999996`).
 */
export function fractionToPercent(fraction: number): number {
  return roundTo(fraction * 100, PERCENT_DISPLAY_DECIMALS)
}

/** 10 -> 0.1 for storage — the inverse of `fractionToPercent`, rounded the same way. */
export function percentToFraction(percent: number): number {
  return roundTo(percent / 100, FRACTION_STORAGE_DECIMALS)
}
