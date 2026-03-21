/** Max number of areas shown in the QA list modal per style. */
export const QA_LIST_TAKE_RECENT = 30

/**
 * Style keys that show the "list" modal (last QA_LIST_TAKE_RECENT areas by status).
 * Single source of truth: also used by QaAreasListDialog to enable the list button and query.
 */
export const QA_LIST_STYLE_KEYS = [
  'user-not-ok-processing',
  'user-not-ok-osm',
  'user-ok-construction',
  'user-ok-reference-error',
  'user-ok-qa-tooling-error',
  'user-pending-needs-review',
  'user-pending-problematic',
] as const

export type QaListStyleKey = (typeof QA_LIST_STYLE_KEYS)[number]

export function isQaListStyleKey(key: string) {
  return (QA_LIST_STYLE_KEYS as readonly string[]).includes(key)
}
