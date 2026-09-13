export const reviewEntriesSourceId = 'review-entries-source'
export const reviewEntriesLayerId = 'review-entries-layer'
/** Invisible pick target (atlas `hitarea-*` / Mapillary `point-click-target`). */
export const reviewEntriesHitareaLayerId = `${reviewEntriesLayerId}-hitarea`
export const reviewEntriesInteractiveLayerIds = [
  `${reviewEntriesHitareaLayerId}-fill`,
  `${reviewEntriesHitareaLayerId}-line`,
  reviewEntriesHitareaLayerId,
] as const
