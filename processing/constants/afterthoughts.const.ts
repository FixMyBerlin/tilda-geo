/**
 * Afterthought ids + skip reasons for the processing run.
 * Hand-mirrored in app/src/data/processingTypes/afterthoughts.const.ts (which adds German labels);
 * sync of the KEYS is enforced by app/src/server/processing/afterthoughts.const.sync.test.ts.
 */
export const afterthoughtIds = ['statistics', 'sidepath_export'] as const
export type AfterthoughtId = (typeof afterthoughtIds)[number]

export const afterthoughtSkipReasons = [
  'failed',
  'unchanged',
  'roads_bikelanes_skipped',
  'no_settlement_areas_table',
] as const
export type AfterthoughtSkipReason = (typeof afterthoughtSkipReasons)[number]
