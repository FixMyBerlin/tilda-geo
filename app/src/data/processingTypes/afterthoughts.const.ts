/**
 * Afterthought ids + skip reasons for the admin UI (German labels are app-only).
 * Hand-mirrored from processing/constants/afterthoughts.const.ts; sync of the KEYS is enforced by
 * afterthoughts.const.sync.test.ts (see that test for why + how to fix on failure).
 */
export const afterthoughtLabels = {
  statistics: 'Statistiken',
  campaign_counts: 'Kampagnen-Zähler',
  sidepath_export: 'Sidepath-Export',
} as const

export type AfterthoughtId = keyof typeof afterthoughtLabels

export const afterthoughtIds = Object.keys(afterthoughtLabels) as [
  AfterthoughtId,
  ...AfterthoughtId[],
]

export const afterthoughtSkipReasonLabels = {
  failed: 'Fehlgeschlagen',
  unchanged: 'Unverändert',
  roads_bikelanes_skipped: 'roads_bikelanes übersprungen',
  missing_tables: 'Tabellen fehlen',
  no_settlement_areas_table: '_settlement_areas fehlt',
} as const

export type AfterthoughtSkipReason = keyof typeof afterthoughtSkipReasonLabels

export const afterthoughtSkipReasons = Object.keys(afterthoughtSkipReasonLabels) as [
  AfterthoughtSkipReason,
  ...AfterthoughtSkipReason[],
]
