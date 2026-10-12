import type { QaIndicatorStatusPair } from './qaIndicatorStatus'

/**
 * Map default: every indicator Gut, no user decision. The server omits cells matching this from
 * the payload (`isQaMapDefaultLetters` in `qaIndicatorStatus.ts`), so a missing cell in a full
 * payload means "all indicators default" rather than "unevaluated" — the details panel still
 * loads the real evaluation. One pair per indicator, since the payload carries one letter per
 * indicator in `QaConfig.indicators` order.
 */
export const qaMapDefaultIndicatorPairs = (indicatorCount: number) =>
  Array.from({ length: indicatorCount }, (): QaIndicatorStatusPair => ({
    systemStatus: 'GOOD',
    userStatus: null,
  }))

/** Defaults are only omitted when the payload is the full config, not a user/search subset. */
export const qaMapPayloadAppliesDefault = (filters: { search?: string; userIds?: string[] }) =>
  !filters.search && !(filters.userIds && filters.userIds.length > 0)
