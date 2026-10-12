import type { QaEvaluationStatus, QaSystemStatus } from '@/prisma/generated/browser'

/**
 * The map payload carries one letter per indicator (in `QaConfig.indicators` order) instead of
 * one status per cell: `{ areaId, sys: 'GNP', usr: '..D' }`. Docs: docs/QA-Map-Status-Payload.md.
 */
export const QA_SYSTEM_STATUS_LETTER = {
  GOOD: 'G',
  NEEDS_REVIEW: 'N',
  PROBLEMATIC: 'P',
  TRUSTED_EDITOR_CHANGE: 'T',
} as const satisfies Record<QaSystemStatus, string>

export const QA_USER_STATUS_LETTER = {
  OK_STRUCTURAL_CHANGE: 'S',
  OK_REFERENCE_ERROR: 'R',
  NOT_OK_DATA_ERROR: 'D',
  NOT_OK_PROCESSING_ERROR: 'P',
  OK_QA_TOOLING_ERROR: 'Q',
} as const satisfies Record<QaEvaluationStatus, string>

/** No user decision on that indicator. */
export const QA_NO_USER_STATUS_LETTER = '.'

// Object.entries/fromEntries widen both the reversed keys and values to `string` — keep the cast.
const systemStatusByLetter = Object.fromEntries(
  Object.entries(QA_SYSTEM_STATUS_LETTER).map(([status, letter]) => [letter, status]),
) as Record<string, QaSystemStatus>

const userStatusByLetter = Object.fromEntries(
  Object.entries(QA_USER_STATUS_LETTER).map(([status, letter]) => [letter, status]),
) as Record<string, QaEvaluationStatus>

export type QaIndicatorStatusPair = {
  systemStatus: QaSystemStatus
  userStatus: QaEvaluationStatus | null
}

/** Per indicator, in `QaConfig.indicators` order. */
export const encodeQaStatusLetters = (indicators: QaIndicatorStatusPair[]) => ({
  sys: indicators.map((indicator) => QA_SYSTEM_STATUS_LETTER[indicator.systemStatus]).join(''),
  usr: indicators
    .map((indicator) =>
      indicator.userStatus ? QA_USER_STATUS_LETTER[indicator.userStatus] : QA_NO_USER_STATUS_LETTER,
    )
    .join(''),
})

/**
 * Unknown letters (payload written by an older/newer config) fall back to the map default, so a
 * config change between payload and client never throws.
 */
export const decodeQaStatusLetters = (sys: string, usr: string) =>
  Array.from({ length: sys.length }, (_, index) => ({
    systemStatus: systemStatusByLetter[sys[index]!] ?? 'GOOD',
    userStatus: userStatusByLetter[usr[index] ?? QA_NO_USER_STATUS_LETTER] ?? null,
  })) satisfies QaIndicatorStatusPair[]

/** Cells where every indicator is GOOD without a user decision are omitted from the map payload. */
export const isQaMapDefaultLetters = (sys: string, usr: string) =>
  /^G*$/.test(sys) && /^\.*$/.test(usr)

/**
 * How bad an indicator looks on the map. A user NOT_OK outranks every system status (a human
 * confirmed the problem); a user OK outranks only GOOD, so one reviewed indicator never hides an
 * open problem on another one. TRUSTED_EDITOR_CHANGE ("Gut (Vertrauensliste)") ranks like a user OK.
 */
const qaEffectiveRank = ({ systemStatus, userStatus }: QaIndicatorStatusPair) => {
  if (userStatus === 'NOT_OK_DATA_ERROR' || userStatus === 'NOT_OK_PROCESSING_ERROR') return 4
  if (userStatus) return 1
  if (systemStatus === 'PROBLEMATIC') return 3
  if (systemStatus === 'NEEDS_REVIEW') return 2
  if (systemStatus === 'TRUSTED_EDITOR_CHANGE') return 1
  return 0
}

/**
 * The cell color: the worst of the selected indicators. Returns the winning pair so the existing
 * paint expression keeps working on one (systemStatus, userStatus) pair. Ties keep the first
 * indicator, i.e. the config order.
 */
export const worstQaIndicatorStatus = <T extends QaIndicatorStatusPair>(indicators: T[]) => {
  let worst: T | undefined
  let worstRank = -1
  for (const indicator of indicators) {
    const rank = qaEffectiveRank(indicator)
    if (rank > worstRank) {
      worst = indicator
      worstRank = rank
    }
  }
  return worst
}

/** The status a reviewer sees for one indicator: their own decision wins over the system. */
export const qaEffectiveStatus = ({ systemStatus, userStatus }: QaIndicatorStatusPair) =>
  userStatus ?? systemStatus

/**
 * An indicator is "open" when it needs attention and nobody has decided about it yet.
 * TRUSTED_EDITOR_CHANGE is already judged good by the trusted-editor list, so it is not open.
 */
export const isOpenQaIndicator = ({ systemStatus, userStatus }: QaIndicatorStatusPair) =>
  userStatus === null && systemStatus !== 'GOOD' && systemStatus !== 'TRUSTED_EDITOR_CHANGE'
