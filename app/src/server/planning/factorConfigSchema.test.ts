import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  parseFactorConfigSnapshot,
  parseVariantFactorConfig,
  VariantFactorConfigSchema,
} from './factorConfigSchema'
import { runFreshnessAfterFactorSave } from './factorFingerprint'
import { mergeFactorConfig, type PlanningAreaInput } from './mergeFactorConfig'

const area: PlanningAreaInput = {
  studyArea: { type: 'Polygon', coordinates: [] },
  useCase: 'fahrradbox',
  areaSizeM2: null,
}

// A config stored under an older schema: renamed enum value, out-of-range resolution.
const oldStored = {
  weights: { w_cyclepath: 0.2 },
  dem_source: 'old_dem',
  h3_resolution: 4,
  min_score_threshold: 40,
  legacy_key: 'kept',
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseVariantFactorConfig', () => {
  it('drops stored values that no longer fit and keeps the rest', () => {
    expect(parseVariantFactorConfig(oldStored)).toEqual({
      weights: { w_cyclepath: 0.2 },
      min_score_threshold: 40,
      legacy_key: 'kept',
    })
    expect(console.warn).toHaveBeenCalledTimes(2)
  })

  it('falls back to an empty config when the stored value is not an object', () => {
    expect(parseVariantFactorConfig(null)).toEqual({})
    expect(parseVariantFactorConfig([1, 2])).toEqual({})
  })

  it('leaves the input schema strict', () => {
    expect(VariantFactorConfigSchema.safeParse(oldStored).success).toBe(false)
  })
})

describe('parseFactorConfigSnapshot', () => {
  it('reads an old snapshot so the run counts as outdated instead of throwing', () => {
    const snapshot = parseFactorConfigSnapshot({
      ...mergeFactorConfig(area, {}),
      dem_source: 'old_dem',
    })
    expect(runFreshnessAfterFactorSave({ dem_source: 'srtm' }, area, snapshot)).toBe('stale')
  })
})
