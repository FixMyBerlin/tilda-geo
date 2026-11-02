import { z } from 'zod'
import type { QaEvaluationStatus, QaSystemStatus } from '@/prisma/generated/client'
import { systemStatusConfig } from './detail/qaConfigs'

type QaStatusOption = { key: string; group: string; label: string } & (
  | { userStatus: null; systemStatus: QaSystemStatus }
  | { userStatus: QaEvaluationStatus; systemStatus: null }
)

export const QA_STATUS_GROUPS = ['Zu prüfen', 'Bewertet: Nicht OK', 'Bewertet: OK'] as const

export const QA_STATUS_OPTIONS = [
  {
    key: 'pending-needs-review',
    group: 'Zu prüfen',
    label: systemStatusConfig.NEEDS_REVIEW.label,
    userStatus: null,
    systemStatus: 'NEEDS_REVIEW',
  },
  {
    key: 'pending-problematic',
    group: 'Zu prüfen',
    label: systemStatusConfig.PROBLEMATIC.label,
    userStatus: null,
    systemStatus: 'PROBLEMATIC',
  },
  {
    key: 'not-ok-processing',
    group: 'Bewertet: Nicht OK',
    label: 'Prozessierung',
    userStatus: 'NOT_OK_PROCESSING_ERROR',
    systemStatus: null,
  },
  {
    key: 'not-ok-osm',
    group: 'Bewertet: Nicht OK',
    label: 'OSM',
    userStatus: 'NOT_OK_DATA_ERROR',
    systemStatus: null,
  },
  {
    key: 'ok-construction',
    group: 'Bewertet: OK',
    label: 'Strukturelle Änderung',
    userStatus: 'OK_STRUCTURAL_CHANGE',
    systemStatus: null,
  },
  {
    key: 'ok-reference-error',
    group: 'Bewertet: OK',
    label: 'Fehler Referenzdaten',
    userStatus: 'OK_REFERENCE_ERROR',
    systemStatus: null,
  },
  {
    key: 'ok-qa-tooling-error',
    group: 'Bewertet: OK',
    label: 'QA-Tooling-Fehler',
    userStatus: 'OK_QA_TOOLING_ERROR',
    systemStatus: null,
  },
  {
    key: 'pending-trusted-editor-change',
    group: 'Bewertet: OK',
    label: systemStatusConfig.TRUSTED_EDITOR_CHANGE.label,
    userStatus: null,
    systemStatus: 'TRUSTED_EDITOR_CHANGE',
  },
] as const satisfies readonly (QaStatusOption & { group: (typeof QA_STATUS_GROUPS)[number] })[]

export type QaStatusKey = (typeof QA_STATUS_OPTIONS)[number]['key']

const zodQaStatusKey = z.enum(
  QA_STATUS_OPTIONS.map((option) => option.key) as [QaStatusKey, ...QaStatusKey[]],
)

export const QA_STATUS_SELECT_ALL = 'all'

export const QA_DEFAULT_STATUS_KEYS = QA_STATUS_OPTIONS.filter(
  (option) => option.group === 'Zu prüfen',
).map((option) => option.key)

// One key is the older URL form; it stays valid so existing links keep working.
export const zodQaParamStatus = z.union([
  zodQaStatusKey,
  z.literal(QA_STATUS_SELECT_ALL),
  z.array(zodQaStatusKey).min(1),
])

export type QaStatusParam = z.infer<typeof zodQaParamStatus>

// Per-field `.catch` keeps stale bookmarks usable: `optionalSearchJson` drops the whole `qa` object
// as soon as one field fails, which would lose the config key and reset the panel. A retired status
// key or filter value now falls back to its default instead. `key` stays strict — without it there
// is nothing to show.
export const zodQaParam = z.object({
  key: z.string(),
  status: zodQaParamStatus.optional().catch(undefined),
  users: z.array(z.string()).optional().catch(undefined),
  // Selected indicator keys (`QaConfig.indicators[].key`); absent or empty = all indicators, same
  // convention as `users`. Dropped from the URL as soon as nothing is filtered out.
  ind: z.array(z.string()).optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  extent: z.enum(['view', 'all']).optional().catch(undefined),
})

export type QaParamData = z.infer<typeof zodQaParam>

export const defaultQaParam: QaParamData = { key: '' }

export const compactQaParam = (data: QaParamData) => {
  if (!data.key) return undefined
  const next: QaParamData = { key: data.key }
  if (data.status) next.status = data.status
  if (data.users && data.users.length > 0) next.users = data.users
  if (data.ind && data.ind.length > 0) next.ind = data.ind
  if (data.search) next.search = data.search
  if (data.extent && data.extent !== 'view') next.extent = data.extent
  return next
}

/** `undefined` = every indicator selected (the default, matching the compacted-away URL state). */
export const resolvedQaIndicatorKeys = (ind: QaParamData['ind'], allKeys: readonly string[]) =>
  ind && ind.length > 0 ? allKeys.filter((key) => ind.includes(key)) : [...allKeys]

/** Selected statuses; a missing URL status is the default. `undefined` = Alle Status. */
export const resolvedQaStatusKeys = (status: QaParamData['status']) => {
  const resolved = status ?? QA_DEFAULT_STATUS_KEYS
  if (resolved === QA_STATUS_SELECT_ALL) return undefined
  return Array.isArray(resolved) ? resolved : [resolved]
}
