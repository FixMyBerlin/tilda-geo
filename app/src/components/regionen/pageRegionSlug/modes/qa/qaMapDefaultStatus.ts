import { SYSTEM_STATUS_TO_LETTER } from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'

type QaMapStatusFields = {
  systemStatus: string | null
  userStatus: string | null
}

/**
 * Map default: system Gut, no user decision. `getQaDataForMap` omits these rows.
 * Missing payload + this default is indistinguishable from unevaluated on the map;
 * the details panel still loads the real evaluation.
 */
export const QA_MAP_DEFAULT_STATUS = {
  systemStatus: SYSTEM_STATUS_TO_LETTER.GOOD,
  userStatus: null,
} as const satisfies QaMapStatusFields

/** Latest-evaluation SQL (`l`) matching {@link QA_MAP_DEFAULT_STATUS}. */
export const QA_MAP_DEFAULT_SQL_PREDICATE = `l."systemStatus" = 'GOOD' AND l."userStatus" IS NULL`

export const isQaMapDefaultStatus = (item: QaMapStatusFields) =>
  item.systemStatus === QA_MAP_DEFAULT_STATUS.systemStatus && item.userStatus === null

/** Defaults are only omitted when the payload is the full config, not a user/search subset. */
export const qaMapPayloadAppliesDefault = (filters: { search?: string; userIds?: string[] }) =>
  !filters.search && !(filters.userIds && filters.userIds.length > 0)

export const resolveQaMapStatus = <T extends QaMapStatusFields>(
  item: T | undefined,
  applyDefault: boolean,
) => {
  if (item) return item
  if (applyDefault) return QA_MAP_DEFAULT_STATUS
  return undefined
}
