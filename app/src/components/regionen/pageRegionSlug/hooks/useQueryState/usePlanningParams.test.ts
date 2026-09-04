import { describe, expect, it } from 'vitest'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { planningSelectionSearch } from './usePlanningParams'

describe('planningSelectionSearch', () => {
  it('writes area, variant, and run together and drops the legacy scenario param', () => {
    expect(planningSelectionSearch({ area: 2, variant: 3, run: 5 })).toEqual({
      [searchParamsRegistry.planningArea]: 2,
      [searchParamsRegistry.planningVariant]: 3,
      [searchParamsRegistry.planningScenario]: undefined,
      [searchParamsRegistry.planningRun]: 5,
    })
  })

  it('clears selection keys with undefined so updateSearch deletes them', () => {
    expect(planningSelectionSearch({ area: null, variant: null, run: null })).toEqual({
      [searchParamsRegistry.planningArea]: undefined,
      [searchParamsRegistry.planningVariant]: undefined,
      [searchParamsRegistry.planningScenario]: undefined,
      [searchParamsRegistry.planningRun]: undefined,
    })
  })

  it('leaves planning untouched unless the caller passes it', () => {
    expect(planningSelectionSearch({ area: 1, variant: null, run: null })).not.toHaveProperty(
      searchParamsRegistry.planning,
    )
  })

  it('clears planning in the same patch as selection when leaving Flächenfinder', () => {
    expect(
      planningSelectionSearch({ area: null, variant: null, run: null, planning: false }),
    ).toEqual({
      [searchParamsRegistry.planning]: undefined,
      [searchParamsRegistry.planningArea]: undefined,
      [searchParamsRegistry.planningVariant]: undefined,
      [searchParamsRegistry.planningScenario]: undefined,
      [searchParamsRegistry.planningRun]: undefined,
    })
  })

  it('can turn planning on in the same patch', () => {
    expect(
      planningSelectionSearch({ area: null, variant: null, run: null, planning: true }),
    ).toEqual({
      [searchParamsRegistry.planning]: true,
      [searchParamsRegistry.planningArea]: undefined,
      [searchParamsRegistry.planningVariant]: undefined,
      [searchParamsRegistry.planningScenario]: undefined,
      [searchParamsRegistry.planningRun]: undefined,
    })
  })
})
