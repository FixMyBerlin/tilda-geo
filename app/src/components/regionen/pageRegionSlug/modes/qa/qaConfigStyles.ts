import { z } from 'zod'
import { frenchQuote } from '@/components/shared/text/Quotes'
import type { QaEvaluationStatus, QaSystemStatus } from '@/prisma/generated/client'
import { systemStatusConfig, userStatusConfig } from './detail/qaConfigs'

export const QA_STATUS_OPTIONS = [
  {
    key: 'pending-needs-review',
    label: `Zu prüfen: System-Entscheidung ${frenchQuote(systemStatusConfig.NEEDS_REVIEW.label)}`,
    userStatus: null,
    systemStatus: 'NEEDS_REVIEW',
  },
  {
    key: 'pending-problematic',
    label: `Zu prüfen: System-Entscheidung ${frenchQuote(systemStatusConfig.PROBLEMATIC.label)}`,
    userStatus: null,
    systemStatus: 'PROBLEMATIC',
  },
  {
    key: 'not-ok-processing',
    label: `Nutzer: ${userStatusConfig.NOT_OK_PROCESSING_ERROR.label}`,
    userStatus: 'NOT_OK_PROCESSING_ERROR',
    systemStatus: null,
  },
  {
    key: 'not-ok-osm',
    label: `Nutzer: ${userStatusConfig.NOT_OK_DATA_ERROR.label}`,
    userStatus: 'NOT_OK_DATA_ERROR',
    systemStatus: null,
  },
  {
    key: 'ok-construction',
    label: `Nutzer: ${userStatusConfig.OK_STRUCTURAL_CHANGE.label}`,
    userStatus: 'OK_STRUCTURAL_CHANGE',
    systemStatus: null,
  },
  {
    key: 'ok-reference-error',
    label: `Nutzer: ${userStatusConfig.OK_REFERENCE_ERROR.label}`,
    userStatus: 'OK_REFERENCE_ERROR',
    systemStatus: null,
  },
  {
    key: 'ok-qa-tooling-error',
    label: `Nutzer: ${userStatusConfig.OK_QA_TOOLING_ERROR.label}`,
    userStatus: 'OK_QA_TOOLING_ERROR',
    systemStatus: null,
  },
] as const satisfies readonly {
  key: string
  label: string
  userStatus: QaEvaluationStatus | null
  systemStatus: QaSystemStatus | null
}[]

export type QaStatusKey = (typeof QA_STATUS_OPTIONS)[number]['key']

export const zodQaStatusKey = z.enum(
  QA_STATUS_OPTIONS.map((option) => option.key) as [QaStatusKey, ...QaStatusKey[]],
)

export const QA_STATUS_SELECT_ALL = 'all'

export const QA_DEFAULT_STATUS_KEY = QA_STATUS_OPTIONS[0]!.key

/** Status dropdown: default first, then Alle Status, then the remaining statuses. */
export const QA_STATUS_FILTER_OPTIONS = [
  { value: QA_DEFAULT_STATUS_KEY, label: QA_STATUS_OPTIONS[0]!.label },
  { value: QA_STATUS_SELECT_ALL, label: 'Alle' },
  ...QA_STATUS_OPTIONS.slice(1).map((option) => ({ value: option.key, label: option.label })),
] as const

export const zodQaParamStatus = z.union([zodQaStatusKey, z.literal(QA_STATUS_SELECT_ALL)])

export type QaStatusParam = z.infer<typeof zodQaParamStatus>

// Per-field `.catch` keeps stale bookmarks usable: `optionalSearchJson` drops the whole `qa` object
// as soon as one field fails, which would lose the config key and reset the panel. A retired status
// key or filter value now falls back to its default instead. `key` stays strict — without it there
// is nothing to show.
export const zodQaParam = z.object({
  key: z.string(),
  status: zodQaParamStatus.optional().catch(undefined),
  users: z.array(z.string()).optional().catch(undefined),
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
  if (data.search) next.search = data.search
  if (data.extent && data.extent !== 'view') next.extent = data.extent
  return next
}

/** Missing URL status is the default filter, not Alle Status. */
export const resolvedQaStatusSelectValue = (status: QaParamData['status']) =>
  status ?? QA_DEFAULT_STATUS_KEY

/** `undefined` = show every area on the map (Alle Status). */
export const qaStatusForMapFilter = (status: QaParamData['status']) => {
  const resolved = resolvedQaStatusSelectValue(status)
  return resolved === QA_STATUS_SELECT_ALL ? undefined : resolved
}
