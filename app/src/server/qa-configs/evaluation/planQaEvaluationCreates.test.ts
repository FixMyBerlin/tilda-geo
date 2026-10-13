import { describe, expect, test } from 'vitest'
import type { QaIndicator } from '@/server/qa-configs/schemas/qaIndicatorsSchema'
import type { QaIndicatorTableRow, QaLatestEvaluationRow } from './planQaEvaluationCreates'
import { planQaEvaluationCreates } from './planQaEvaluationCreates'
import type { QaLastEditor } from './qaEvaluationRules'

const thresholds = {
  goodThreshold: 0.1,
  needsReviewThreshold: 0.2,
  absoluteDifferenceThreshold: 4,
}

const total: QaIndicator = { key: 'total', label: 'Stellplätze', ...thresholds }
const surface: QaIndicator = { key: 'surface', label: 'Belag', ...thresholds }
const indicators = [total, surface]

const referenceFrozenAt = new Date('2026-01-01T00:00:00Z')

// No trusted usernames and no editors, so these tests cover the plain threshold rules.
const withoutTrustedEditors = {
  unit: 'Stellplätze',
  lastEditorsByAreaId: new Map<string, QaLastEditor[]>(),
  trustConfig: { trustedOsmUsernames: [], referenceFrozenAt },
}

/** Against a reference of 100: `current` 100 → GOOD, 50 → PROBLEMATIC (deviation 0.5, difference above the absolute threshold). */
const row = (areaId: string, indicatorKey: string, current: number) =>
  ({
    areaId,
    indicatorKey,
    reference: 100,
    current,
    difference: 100 - current,
    deviation: (100 - current) / 100,
    breakdown: indicatorKey === 'total' ? null : { asphalt: { reference: 100, current } },
  }) satisfies QaIndicatorTableRow

const latest = (
  areaId: string,
  indicatorKey: string,
  systemStatus: QaLatestEvaluationRow['systemStatus'],
  userStatus: QaLatestEvaluationRow['userStatus'] = null,
) => ({ areaId, indicatorKey, systemStatus, userStatus }) satisfies QaLatestEvaluationRow

describe('planQaEvaluationCreates', () => {
  test('first sighting: one row per indicator, in config order', () => {
    const plan = planQaEvaluationCreates({
      // Table order is surface-first on purpose: output must follow the config, not the table.
      indicatorRows: [row('a1', 'surface', 50), row('a1', 'total', 100)],
      latestRows: [],
      indicators,
      ...withoutTrustedEditors,
    })

    expect(plan.creates.map((create) => create.indicatorKey)).toEqual(['total', 'surface'])
    expect(plan.creates.map((create) => create.systemStatus)).toEqual(['GOOD', 'PROBLEMATIC'])
    expect(plan).toMatchObject({ areas: 1, indicators: 2, created: 2, resets: 0 })
    expect(plan.creates[0]!.decisionData).toEqual({
      reference: 100,
      current: 100,
      difference: 0,
      deviation: 0,
      thresholds,
    })
    expect(plan.creates[1]!.decisionData).toMatchObject({
      breakdown: { asphalt: { reference: 100, current: 50 } },
    })
  })
  test('status change: only the indicator that moved gets a row', () => {
    const plan = planQaEvaluationCreates({
      indicatorRows: [
        row('a1', 'total', 100),
        row('a1', 'surface', 50),
        row('a2', 'total', 100),
        row('a2', 'surface', 100),
      ],
      latestRows: [
        latest('a1', 'total', 'GOOD'),
        latest('a1', 'surface', 'GOOD'),
        latest('a2', 'total', 'GOOD'),
        latest('a2', 'surface', 'GOOD'),
      ],
      indicators,
      ...withoutTrustedEditors,
    })

    expect(plan.creates).toHaveLength(1)
    expect(plan.creates[0]).toMatchObject({
      areaId: 'a1',
      indicatorKey: 'surface',
      systemStatus: 'PROBLEMATIC',
    })
    expect(plan).toMatchObject({ areas: 2, indicators: 4, created: 1, resets: 0 })
  })

  test('reset: a resettable user decision is cleared once the indicator becomes GOOD', () => {
    const plan = planQaEvaluationCreates({
      indicatorRows: [row('a1', 'total', 100)],
      latestRows: [latest('a1', 'total', 'PROBLEMATIC', 'NOT_OK_DATA_ERROR')],
      indicators,
      ...withoutTrustedEditors,
    })

    expect(plan.creates).toHaveLength(1)
    expect(plan.creates[0]).toMatchObject({ indicatorKey: 'total', systemStatus: 'GOOD' })
    expect(plan).toMatchObject({ created: 0, resets: 1 })
  })
  test('unknown indicator key in the table is reported and skipped', () => {
    const plan = planQaEvaluationCreates({
      indicatorRows: [row('a1', 'total', 100), row('a1', 'access', 50), row('a1', 'surface', 50)],
      latestRows: [],
      indicators,
      ...withoutTrustedEditors,
    })

    expect(plan.unknownIndicatorKeys).toEqual(['access'])
    expect(plan.creates.map((create) => create.indicatorKey)).toEqual(['total', 'surface'])
    expect(plan.indicators).toBe(2)
  })

  test('config key missing from the table is reported and no status is invented', () => {
    const plan = planQaEvaluationCreates({
      indicatorRows: [row('a1', 'total', 100)],
      // `surface` has a stale PROBLEMATIC row but no table row: it keeps that status untouched.
      latestRows: [latest('a1', 'total', 'GOOD'), latest('a1', 'surface', 'PROBLEMATIC')],
      indicators,
      ...withoutTrustedEditors,
    })

    expect(plan.missingIndicatorKeys).toEqual(['surface'])
    expect(plan.creates).toEqual([])
    expect(plan).toMatchObject({ areas: 1, indicators: 1, created: 0, resets: 0 })
  })
})

describe('planQaEvaluationCreates — TRUSTED_EDITOR_CHANGE', () => {
  const afterCutoff = Math.floor(referenceFrozenAt.getTime() / 1000) + 3600

  // Surface with a wider tolerance than the total (4), so one cell's untrusted
  // amount can sit above one indicator's threshold and below the other's.
  const tolerantSurface: QaIndicator = { ...surface, absoluteDifferenceThreshold: 10 }

  const planWithEditors = (input: {
    editors: QaLastEditor[]
    indicatorRows?: QaIndicatorTableRow[]
    planIndicators?: QaIndicator[]
  }) =>
    planQaEvaluationCreates({
      indicatorRows: input.indicatorRows ?? [row('a1', 'total', 50)],
      latestRows: [],
      indicators: input.planIndicators ?? indicators,
      unit: 'Stellplätze',
      lastEditorsByAreaId: new Map([['a1', input.editors]]),
      trustConfig: { trustedOsmUsernames: ['alice', 'bob'], referenceFrozenAt },
    })

  test('a trusted editor covering a PROBLEMATIC indicator creates a row naming them', () => {
    const plan = planWithEditors({
      editors: [{ osmUser: 'Alice', amount: 50, updatedAt: afterCutoff }],
    })

    expect(plan.creates).toHaveLength(1)
    expect(plan.creates[0]).toMatchObject({
      areaId: 'a1',
      indicatorKey: 'total',
      systemStatus: 'TRUSTED_EDITOR_CHANGE',
      decisionData: { difference: 50, deviation: 0.5 },
    })
    expect(plan.creates[0]!.body).toContain('Alice')
    expect(plan.creates[0]!.body).toContain('seit dem 1.1.2026')
    expect(plan.trustedEditorChanges).toBe(1)
  })

  test('one editor list, per-indicator tolerance: total and surface differ', () => {
    // Untrusted amount 6: above total's threshold (4), within surface's (10).
    const plan = planWithEditors({
      editors: [
        { osmUser: 'Alice', amount: 44, updatedAt: afterCutoff },
        { osmUser: 'Carol', amount: 6, updatedAt: afterCutoff },
      ],
      indicatorRows: [row('a1', 'total', 50), row('a1', 'surface', 50)],
      planIndicators: [total, tolerantSurface],
    })

    expect(plan.creates.map((create) => [create.indicatorKey, create.systemStatus])).toEqual([
      ['total', 'PROBLEMATIC'],
      ['surface', 'TRUSTED_EDITOR_CHANGE'],
    ])
    expect(plan.creates[0]!.body).toBeNull()
    expect(plan.creates[1]!.body).toContain('6 Stellplätze wurden zuletzt von anderen')
    expect(plan.creates[1]!.body).toContain('zulässigen Differenz von 10')
    expect(plan.trustedEditorChanges).toBe(1)
  })
})
